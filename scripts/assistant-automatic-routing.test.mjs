import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const plain = (value) => JSON.parse(JSON.stringify(value));
function loadTs(path, mocks = {}, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    crypto: { randomUUID },
    require: (name) => name in mocks ? mocks[name] : require(name),
    ...globals,
  });
  return exports;
}
const errorHelpers = loadTs("../features/assistant/api/assistantErrors.ts");
const apiErrors = loadTs("../lib/api-errors.ts");
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function http(status, data = {}, code) {
  return Object.assign(new Error("Transport error"), {
    isAxiosError: true,
    code,
    ...(status ? { response: { status, data } } : {}),
  });
}
const reply = (extra = {}) => ({ conversation_id: 41, reply: "Resposta do SobraAi", ...extra });
const history = [{ id: 41, title: "Planejamento" }, { id: 57, title: "Reservas" }];
async function settle() {
  for (let index = 0; index < 8; index++) await Promise.resolve();
}
function fixture(overrides = {}, initialAuth = {}) {
  let token = "session-A", subscriber, clock = 1793210400000, expenseRevision = 0;
  let authState = { hasHydrated: true, isAuthenticated: true, user: { email: "a@example.test" }, ...initialAuth };
  const logoutMessages = [], calls = [];
  function observe(change) {
    const previous = authState;
    authState = { ...authState, ...change };
    subscriber?.(authState, previous);
  }
  const auth = {
    subscribe: (fn) => { subscriber = fn; return () => {}; },
    getState: () => ({ ...authState, logout: (message) => {
      logoutMessages.push(message);
      token = null;
      observe({ isAuthenticated: false, user: null });
    } }),
  };
  const handlers = {
    getConversations: async () => history,
    getConversationMessages: async (id) => [{ id: 1, conversation_id: id, role: "assistant", content: "Histórico mantido" }],
    sendMessage: async () => reply(),
    deleteConversation: async () => {},
    ...overrides,
  };
  const api = Object.fromEntries(Object.keys(handlers).map((method) => [method, async (...args) => {
    calls.push({ method, args: plain(args) });
    return handlers[method](...args);
  }]));
  class Clock extends Date { static now() { return clock; } }
  const store = loadTs("../features/assistant/store/useAssistantStore.ts", {
    "@/features/auth/store/useAuthStore": { useAuthStore: auth },
    "@/features/expenses/store/useExpenseStore": { useExpenseStore: {
      getState: () => ({ revision: expenseRevision }),
      setState: (update) => {
        const next = typeof update === "function" ? update({ revision: expenseRevision }) : update;
        expenseRevision = next.revision ?? expenseRevision;
      },
    } },
    "@/lib/auth-cookie": { getBrowserAuthToken: () => token },
    "@/lib/api-errors": apiErrors,
    "../api/assistantApi": { assistantApi: api },
    "../api/assistantErrors": errorHelpers,
  }, { Date: Clock }).useAssistantStore;
  store.getState().syncSession();
  return {
    store, calls, handlers, logoutMessages,
    state: () => store.getState(),
    expenseRevision: () => expenseRevision,
    observe,
    advance: (milliseconds) => { clock += milliseconds; },
    now: () => clock,
    changeAccount: (next = "session-B") => {
      token = next;
      observe({ hasHydrated: true, isAuthenticated: Boolean(next), user: next ? { email: next + "@example.test" } : null });
    },
  };
}

test("assistant HTTP boundary sends only message and optional conversation identity, never model setup", async () => {
  const calls = [];
  const client = {
    post: async (path, data) => { calls.push({ method: "POST", path, data: plain(data) }); return { data: reply() }; },
    get: async (path) => { calls.push({ method: "GET", path }); return { data: path.endsWith("/messages") ? { messages: [] } : { conversations: history } }; },
    delete: async (path) => { calls.push({ method: "DELETE", path }); },
  };
  const api = loadTs("../features/assistant/api/assistantApi.ts", { "@/lib/api": { apiClient: client } }).assistantApi;
  await api.getConversations();
  await api.sendMessage({ message: "Olá", model_id: "old-selection", provider: "ignored", history: ["private"] });
  await api.sendMessage({ message: "Continuar", conversation_id: 41, model_id: "", api_key: "never-sent" });
  await api.getConversationMessages(41);
  await api.deleteConversation(41);
  assert.deepEqual(calls.filter((item) => item.method === "POST").map((item) => item.data), [
    { message: "Olá" }, { message: "Continuar", conversation_id: 41 },
  ]);
  assert.deepEqual(calls.map((item) => [item.method, item.path]), [
    ["GET", "/api/assistant/conversations"],
    ["POST", "/api/assistant/chat"], ["POST", "/api/assistant/chat"],
    ["GET", "/api/assistant/conversations/41/messages"], ["DELETE", "/api/assistant/conversations/41"],
  ]);
});

test("provider-neutral and historical errors preserve code, API message and positive delay across HTTP and 200", () => {
  for (const code of ["assistant_quota_exceeded", "assistant_user_limit", "assistant_unavailable", "assistant_other", "gemini_quota_exceeded"]) {
    for (const payload of [{ error_code: code, reply: "Aviso da API", retry_after_seconds: 19 }, http(429, { code, message: "Aviso da API", retry_after_seconds: 19 })]) {
      assert.deepEqual(plain(errorHelpers.assistantErrorDetails(payload)), {
        code, message: "Aviso da API", recognized: true, retryAfterSeconds: 19,
      });
    }
  }
  for (const delay of [undefined, null, 0, -1, NaN, Infinity, "30"]) {
    assert.equal(errorHelpers.assistantErrorDetails({ error_code: "assistant_quota_exceeded", retry_after_seconds: delay }).retryAfterSeconds, null);
  }
  const unknown = errorHelpers.assistantErrorDetails({ code: "validation_error", message: "Revise a mensagem", retry_after_seconds: 12 });
  assert.equal(unknown.recognized, false);
  assert.equal(unknown.retryAfterSeconds, 12);
});

test("new chat and explicit confirmation keep conversation ID and tool results without client-side model or history", async () => {
  let count = 0;
  const f = fixture({ sendMessage: async () => ++count === 1
    ? reply({ reply: "Confirma esta despesa?", tool_call: "create_expense", tool_result: { status: "pending_confirmation" } })
    : reply({ reply: "Despesa criada", tool_call: "create_expense", tool_result: { status: "created", expense_id: 8 } }) });
  f.state().setDraft("  Registre meu gasto  ");
  assert.equal(await f.state().sendMessage(f.state().draft), true);
  assert.equal(f.state().draft, "");
  assert.equal(f.state().activeConversationId, 41);
  assert.equal(f.state().messages.at(-1).tool_result.status, "pending_confirmation");
  assert.equal(f.expenseRevision(), 0, "a proposal is not a confirmed financial change");
  assert.equal(count, 1, "a proposal must wait for explicit confirmation");
  f.state().setDraft("sim");
  assert.equal(await f.state().sendMessage(f.state().draft), true);
  assert.deepEqual(f.calls.filter((item) => item.method === "sendMessage").map((item) => item.args[0]), [
    { message: "Registre meu gasto" }, { message: "sim", conversation_id: 41 },
  ]);
  assert.deepEqual(plain(f.state().messages.map((item) => item.role)), ["user", "assistant", "user", "assistant"]);
  assert.equal(f.state().messages.at(-1).tool_result.expense_id, 8);
  assert.equal(f.expenseRevision(), 1, "a created confirmation refreshes financial views exactly once");
});

test("draft clears only after a successful response and never discards a newer draft", async () => {
  const pending = deferred();
  const f = fixture({ sendMessage: () => pending.promise });
  f.state().setDraft("Primeira mensagem");
  const sending = f.state().sendMessage(f.state().draft);
  assert.equal(f.state().draft, "Primeira mensagem");
  f.state().setDraft("Próximo rascunho");
  pending.resolve(reply());
  assert.equal(await sending, true);
  assert.equal(f.state().draft, "Próximo rascunho");
});

test("financial refresh requires a valid success with a created expense, never error or unrelated tools", async () => {
  for (const response of [
    reply({ tool_call: "create_expense", tool_result: { status: "pending_confirmation" } }),
    reply({ tool_call: "other_tool", tool_result: { status: "created" } }),
    { error_code: "assistant_unavailable", tool_call: "create_expense", tool_result: { status: "created" } },
    { reply: "Malformed", tool_call: "create_expense", tool_result: { status: "created" } },
  ]) {
    const f = fixture({ sendMessage: async () => response });
    await f.state().sendMessage("Verificar resposta");
    assert.equal(f.expenseRevision(), 0);
  }
});

test("synchronous duplicate submission and concurrent conversation changes cannot race an accepted send", async () => {
  const pending = deferred();
  const f = fixture({ sendMessage: () => pending.promise });
  f.state().setDraft("Não duplique");
  const sending = f.state().sendMessage(f.state().draft);
  assert.equal(await f.state().sendMessage("Não duplique"), false);
  assert.equal(await f.state().setActiveConversation(57), false);
  assert.equal(await f.state().deleteConversation(41), false);
  assert.equal(f.state().startNewConversation(), false);
  assert.equal(f.calls.length, 1);
  pending.resolve(reply());
  assert.equal(await sending, true);
  assert.equal(f.state().activeConversationId, 41);
  assert.equal(f.state().messages.length, 2);
});

test("message loading refuses send, delete and second navigation while preserving draft and selected identity", async () => {
  const pending = deferred();
  const f = fixture({ getConversationMessages: () => pending.promise });
  f.state().setDraft("Continuar depois");
  const loading = f.state().loadMessages(41);
  assert.equal(await f.state().sendMessage(f.state().draft), false);
  assert.equal(await f.state().setActiveConversation(57), false);
  assert.equal(await f.state().deleteConversation(41), false);
  assert.equal(f.state().startNewConversation(), false);
  assert.equal(f.state().draft, "Continuar depois");
  pending.resolve([{ role: "assistant", content: "Conversa certa" }]);
  assert.equal(await loading, true);
  assert.equal(f.state().activeConversationId, 41);
  assert.equal(f.state().messages[0].content, "Conversa certa");
  assert.deepEqual(f.calls.map((item) => item.method), ["getConversationMessages"]);
});

test("failed message loading requires an explicit read retry or new conversation before sending", async () => {
  const f = fixture({ getConversationMessages: async () => { throw http(500, { message: "Consulta indisponível" }); } });
  f.state().setDraft("Texto retido");
  assert.equal(await f.state().loadMessages(41), false);
  assert.equal(f.state().messagesError, "Consulta indisponível");
  assert.equal(await f.state().sendMessage(f.state().draft), false);
  f.handlers.getConversationMessages = async () => [{ role: "assistant", content: "Recuperada" }];
  assert.equal(await f.state().loadMessages(41), true);
  assert.equal(f.state().messagesError, null);
  assert.equal(await f.state().sendMessage(f.state().draft), true);
  assert.equal(f.calls.filter((item) => item.method === "sendMessage").length, 1);
});

test("deletion blocks all concurrent mutations and selection; active deletion retains draft", async () => {
  const pending = deferred();
  const f = fixture({ deleteConversation: () => pending.promise });
  await f.state().loadConversations();
  await f.state().loadMessages(41);
  f.state().setDraft("Rascunho não enviado");
  const deleting = f.state().deleteConversation(41);
  assert.equal(await f.state().deleteConversation(41), false);
  assert.equal(await f.state().sendMessage(f.state().draft), false);
  assert.equal(await f.state().loadMessages(57), false);
  assert.equal(f.state().startNewConversation(), false);
  pending.resolve();
  assert.equal(await deleting, true);
  assert.equal(f.state().activeConversationId, null);
  assert.equal(f.state().draft, "Rascunho não enviado");
  assert.deepEqual(plain(f.state().conversations.map((item) => item.id)), [57]);
  assert.equal(f.calls.filter((item) => item.method === "deleteConversation").length, 1);
});

test("recognized quota responses preserve draft and cannot be bypassed by clearing retry or changing conversation", async () => {
  for (const isHttp of [false, true]) {
    const payload = { error_code: "assistant_user_limit", message: "Cota do usuário atingida", retry_after_seconds: 7 };
    const f = fixture({ sendMessage: async () => { if (isHttp) throw http(429, payload); return payload; } });
    f.state().setDraft("Mensagem com cota");
    assert.equal(await f.state().sendMessage(f.state().draft), false);
    assert.equal(f.state().draft, "Mensagem com cota");
    assert.equal(f.state().errorCode, "assistant_user_limit");
    assert.equal(f.state().error, payload.message);
    assert.equal(f.state().retryAfterSeconds, 7);
    assert.equal(f.state().retryUntil, f.now() + 7000);
    f.state().clearRetry();
    assert.equal(f.state().retryUntil, f.now() + 7000);
    assert.equal(f.state().startNewConversation(), true);
    assert.equal(await f.state().sendMessage(f.state().draft), false);
    assert.equal(f.calls.filter((item) => item.method === "sendMessage").length, 1);
    f.advance(7001);
    f.state().clearRetry();
    assert.equal(f.state().retryUntil, null);
    f.handlers.sendMessage = async () => reply();
    assert.equal(await f.state().sendMessage(f.state().draft), true);
  }
});

test("cooldown requires a recognized error and a positive server delay, never a success field or invented interval", async () => {
  for (const response of [
    { error_code: "assistant_unavailable", reply: "Indisponível" },
    { error_code: "assistant_unavailable", retry_after_seconds: 0 },
    { error_code: "assistant_unavailable", retry_after_seconds: -8 },
    { code: "other_failure", message: "Outro erro", retry_after_seconds: 8 },
    reply({ retry_after_seconds: 8 }),
  ]) {
    const f = fixture({ sendMessage: async () => response });
    f.state().setDraft("Sem espera inventada");
    await f.state().sendMessage(f.state().draft);
    assert.equal(f.state().retryUntil, null);
  }
  const legacy = fixture({ sendMessage: async () => ({ error_code: "gemini_quota_exceeded", reply: "Limite recebido", retry_after_seconds: 3 }) });
  await legacy.state().sendMessage("compatibilidade");
  assert.equal(legacy.state().error, "Limite recebido");
  assert.equal(legacy.state().retryUntil, legacy.now() + 3000);
});

test("network, timeout, malformed responses and server failures are never retried automatically", async () => {
  for (const result of [http(null, {}, "ERR_NETWORK"), http(null, {}, "ECONNABORTED"), http(500, { message: "Serviço indisponível" }), null, {}, { conversation_id: 0, reply: "Inválida" }]) {
    const f = fixture({ sendMessage: async () => { if (result instanceof Error) throw result; return result; } });
    f.state().setDraft("Preserve esta mensagem");
    assert.equal(await f.state().sendMessage(f.state().draft), false);
    await settle();
    assert.equal(f.state().draft, "Preserve esta mensagem");
    assert.equal(f.state().isSending, false);
    assert.equal(f.calls.filter((item) => item.method === "sendMessage").length, 1);
    assert.match(f.state().error, /não será repetido automaticamente/);
    assert.equal(f.expenseRevision(), 0);
  }
});

test("HTTP code fallback and API messages survive rejection without false acceptance", async () => {
  const f = fixture({ sendMessage: async () => { throw http(429, { code: "assistant_quota_exceeded", message: "Mensagem exata da API", retry_after_seconds: 11 }); } });
  f.state().setDraft("Ainda não enviada");
  assert.equal(await f.state().sendMessage(f.state().draft), false);
  assert.equal(f.state().errorCode, "assistant_quota_exceeded");
  assert.equal(f.state().error, "Mensagem exata da API");
  assert.equal(f.state().draft, "Ainda não enviada");
  assert.equal(f.state().messages.length, 0);
});

test("account switch discards draft and pending response; the new account can send independently", async () => {
  const pending = deferred();
  const f = fixture({ sendMessage: () => pending.promise });
  f.state().setDraft("Segredo da conta A");
  const old = f.state().sendMessage(f.state().draft);
  f.changeAccount();
  assert.equal(f.state().draft, "");
  assert.equal(f.state().messages.length, 0);
  assert.equal(f.state().isSending, false);
  f.handlers.sendMessage = async () => reply({ conversation_id: 82, reply: "Conta B" });
  f.state().setDraft("Conta B pergunta");
  assert.equal(await f.state().sendMessage(f.state().draft), true);
  pending.resolve(reply({ reply: "Segredo da conta A", tool_call: "create_expense", tool_result: { status: "created" } }));
  assert.equal(await old, false);
  assert.equal(f.state().activeConversationId, 82);
  assert.equal(f.state().messages.at(-1).content, "Conta B");
  assert.equal(f.state().messages.length, 2);
  assert.equal(f.expenseRevision(), 0, "an old account cannot refresh the current account's financial state");
});

test("an old 401 cannot log out a new session or replace its state", async () => {
  const pending = deferred();
  const f = fixture({ sendMessage: () => pending.promise });
  const old = f.state().sendMessage("Conta A");
  f.changeAccount();
  f.state().setDraft("Privado B");
  pending.reject(http(401, { message: "Sessão antiga expirada" }));
  assert.equal(await old, false);
  assert.equal(f.logoutMessages.length, 0);
  assert.equal(f.state().draft, "Privado B");
  assert.equal(f.state().error, null);
});

test("401 and revoked 403 clear assistant data in send, history, read and delete flows", async () => {
  for (const status of [401, 403]) {
    for (const method of ["sendMessage", "getConversations", "getConversationMessages", "deleteConversation"]) {
      const f = fixture({ [method]: async () => { throw http(status, { message: "Acesso encerrado pela API" }); } });
      f.state().setDraft("Dado da sessão");
      if (method === "getConversations") await f.state().loadConversations();
      else if (method === "getConversationMessages") await f.state().loadMessages(41);
      else if (method === "deleteConversation") await f.state().deleteConversation(41);
      else await f.state().sendMessage(f.state().draft);
      assert.deepEqual(f.logoutMessages, ["Acesso encerrado pela API"]);
      assert.equal(f.state().draft, "");
      assert.equal(f.state().messages.length, 0);
      assert.equal(f.state().activeConversationId, null);
      assert.equal(f.state().retryUntil, null);
    }
  }
});

test("unresolved hydration does not mean logout and reentry retains conversation and draft", async () => {
  const f = fixture();
  await f.state().loadMessages(41);
  f.state().setDraft("Continuo depois");
  const revision = f.state().sessionRevision;
  f.observe({ hasHydrated: false, isAuthenticated: false });
  f.state().syncSession();
  await f.state().loadConversations();
  assert.equal(await f.state().sendMessage("Não enviar antes da sessão"), false);
  assert.equal(f.state().draft, "Continuo depois");
  assert.equal(f.state().activeConversationId, 41);
  assert.equal(f.state().sessionRevision, revision);
  f.observe({ hasHydrated: true, isAuthenticated: true });
  assert.equal(f.state().sessionRevision, revision);
  assert.equal(f.state().messages[0].content, "Histórico mantido");
  assert.equal(f.state().draft, "Continuo depois");
});

test("an accepted reply during unresolved hydration completes the retained session without stuck sending", async () => {
  const pending = deferred();
  const f = fixture({ sendMessage: () => pending.promise });
  f.state().setDraft("Mensagem da sessão retida");
  const revision = f.state().sessionRevision;
  const sending = f.state().sendMessage(f.state().draft);
  f.observe({ hasHydrated: false, isAuthenticated: false });
  pending.resolve(reply({ reply: "Resposta recebida durante a reentrada" }));
  assert.equal(await sending, true);
  assert.equal(f.state().isSending, false);
  assert.equal(f.state().draft, "");
  assert.equal(f.state().activeConversationId, 41);
  assert.equal(f.state().messages.at(-1).content, "Resposta recebida durante a reentrada");
  f.observe({ hasHydrated: true, isAuthenticated: true });
  assert.equal(f.state().sessionRevision, revision);
  assert.equal(f.state().messages.length, 2);
  assert.equal(f.state().isSending, false);
});

test("late history cannot resurrect a deleted conversation", async () => {
  const f = fixture();
  await f.state().loadConversations();
  const pending = deferred();
  f.handlers.getConversations = () => pending.promise;
  const old = f.state().loadConversations();
  assert.equal(await f.state().deleteConversation(41), true);
  pending.resolve(history);
  await old;
  assert.deepEqual(plain(f.state().conversations.map((item) => item.id)), [57]);
  assert.equal(f.state().isLoadingConversations, false);
});

test("history is optional for sending and old results cannot replace the post-send refresh", async () => {
  const pending = deferred();
  const f = fixture({ getConversations: () => pending.promise });
  const loading = f.state().loadConversations();
  f.handlers.getConversations = async () => [{ id: 41, title: "Histórico novo" }];
  f.state().setDraft("Enviar sem aguardar catálogo ou histórico");
  assert.equal(await f.state().sendMessage(f.state().draft), true);
  await settle();
  pending.resolve([{ id: 57, title: "Antigo" }]);
  await loading;
  assert.equal(f.state().conversations[0].title, "Histórico novo");
  assert.equal(f.state().isLoadingConversations, false);
});

test("late read and delete completions cannot publish data into another account", async () => {
  for (const method of ["getConversationMessages", "deleteConversation", "getConversations"]) {
    const pending = deferred();
    const f = fixture({ [method]: () => pending.promise });
    const old = method === "getConversationMessages" ? f.state().loadMessages(41)
      : method === "deleteConversation" ? f.state().deleteConversation(41) : f.state().loadConversations();
    f.changeAccount();
    f.state().setDraft("Somente a conta atual");
    pending.resolve(method === "deleteConversation" ? undefined : [{ id: 41, role: "assistant", content: "Conta antiga" }]);
    await old;
    assert.equal(f.state().draft, "Somente a conta atual");
    assert.equal(f.state().messages.length, 0);
    assert.equal(f.state().conversations.length, 0);
    assert.equal(f.state().activeConversationId, null);
    assert.equal(f.state().deletingConversationId, null);
  }
});

test("new conversation preserves the unsent draft and a failed deletion keeps the existing conversation", async () => {
  const f = fixture({ deleteConversation: async () => { throw http(500, { message: "Não excluída" }); } });
  await f.state().loadConversations();
  await f.state().loadMessages(41);
  f.state().setDraft("Quero continuar");
  assert.equal(await f.state().deleteConversation(41), false);
  assert.equal(f.state().activeConversationId, 41);
  assert.equal(f.state().messages[0].content, "Histórico mantido");
  assert.equal(f.state().conversations.length, 2);
  assert.equal(f.state().startNewConversation(), true);
  assert.equal(f.state().activeConversationId, null);
  assert.equal(f.state().draft, "Quero continuar");
});
