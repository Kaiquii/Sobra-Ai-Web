import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { withSummaryBenefits } from "../lib/summary-benefits.ts";

const require = createRequire(import.meta.url);
const plain = (value) => JSON.parse(JSON.stringify(value));
const flags = (va = false, vr = false) => ({
  exclude_va_from_available: va,
  exclude_vr_from_available: vr,
});
function loadTs(path, mocks = {}, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => name in mocks ? mocks[name] : require(name),
    ...globals,
  });
  return exports;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function settle() {
  for (let index = 0; index < 3; index++) await Promise.resolve();
}
function http(status) {
  return Object.assign(new Error(`Falha HTTP ${status}`), {
    isAxiosError: true,
    response: { status },
  });
}
function apiFixture(initial = flags()) {
  let response = initial;
  const calls = [];
  const client = {
    get: async (path) => { calls.push({ method: "GET", path }); return { data: response }; },
    patch: async (path, data) => {
      calls.push({ method: "PATCH", path, data: plain(data) });
      return { data: response };
    },
  };
  const api = loadTs("../features/incomes/api/balancePreferencesApi.ts", {
    "@/lib/api": { apiClient: client },
  }).balancePreferencesApi;
  return { api, calls, respond: (next) => { response = next; } };
}
function storeFixture(overrides = {}, initialAuth = {}) {
  let token = "account-A", epoch = 1;
  let authState = {
    hasHydrated: true, isAuthenticated: true, user: { email: "a@example.test" }, ...initialAuth,
  };
  const subscribers = [], calls = [], logoutMessages = [];
  const handlers = {
    getPreferences: async () => flags(),
    patchPreference: async (key, value) => ({ ...flags(), [key]: value }),
    ...overrides,
  };
  function observe(change) {
    const previous = authState;
    authState = { ...authState, ...change };
    for (const subscriber of subscribers) subscriber(authState, previous);
  }
  const auth = {
    subscribe: (subscriber) => { subscribers.push(subscriber); return () => {}; },
    getState: () => ({ ...authState, logout: (message) => {
      logoutMessages.push(message);
      token = null;
      epoch++;
      observe({ isAuthenticated: false, user: null });
    } }),
  };
  const api = Object.fromEntries(Object.keys(handlers).map((method) => [method, async (...args) => {
    calls.push({ method, args: plain(args) });
    return handlers[method](...args);
  }]));
  const store = loadTs("../features/incomes/store/useBalancePreferencesStore.ts", {
    "@/features/auth/store/useAuthStore": { useAuthStore: auth },
    "@/lib/auth-cookie": {
      getBrowserAuthToken: () => token,
      getBrowserAuthSessionEpoch: () => epoch,
    },
    "@/lib/api-errors": {
      getApiErrorStatus: (error) => error.response?.status,
      getApiErrorMessage: (error, fallback) => error.message || fallback,
    },
    "../api/balancePreferencesApi": { balancePreferencesApi: api },
    "@/features/incomes/api/balancePreferencesApi": { balancePreferencesApi: api },
  }).useBalancePreferencesStore;
  return {
    store, calls, handlers, logoutMessages,
    state: () => store.getState(),
    changeAccount: (nextToken = "account-B") => {
      token = nextToken;
      epoch++;
      observe({ isAuthenticated: Boolean(nextToken), user: nextToken ? { email: nextToken + "@example.test" } : null });
    },
    changeEpoch: () => { epoch++; },
    observe,
  };
}
function reportSummary(month, year, preferences = flags(), available = 1125) {
  return {
    month, year, total_income: 1725, total_expense: 600,
    total_geral_disponivel: available, va: 725, vr: 50,
    total_gasto_va: 600, total_gasto_vr: 0, restante_va: 125, restante_vr: 50,
    ...preferences,
  };
}
function reportsFixture(overrides = {}) {
  let token = "account-A", epoch = 1;
  const handlers = {
    getSummary: async (month, year) => reportSummary(month, year),
    getCategories: async () => [{ category_id: 1, category_name: token, total_amount: 600, percentage: 100 }],
    getChart: async () => [{ income: 1725, expense: 600, month: 11 }],
    getYearlySummary: async () => ({ economia_total: 1125, media_mensal: 600 }),
    ...overrides,
  };
  const api = Object.fromEntries(Object.keys(handlers).map((method) => [method, (...args) => handlers[method](...args)]));
  const store = loadTs("../features/reports/store/useReportsStore.ts", {
    "@/features/reports/api/reportsApi": { reportsApi: api },
    "@/lib/auth-cookie": {
      getBrowserAuthToken: () => token,
      getBrowserAuthSessionEpoch: () => epoch,
    },
    "@/lib/api-errors": { getApiErrorMessage: (error, fallback) => error.message || fallback },
  }).useReportsStore;
  return {
    store, handlers, state: () => store.getState(),
    epoch: () => epoch,
    changeAccount: (next = "account-B") => { token = next; epoch++; },
  };
}
function controlsFixture(overrides = {}, { collectEffects = false, collectState = false } = {}) {
  const calls = [], controls = [], buttons = [], effects = [], modals = [], localState = [];
  let localStateIndex = 0;
  const state = {
    preferences: null, isLoading: false, isSaving: false, pendingKey: null, sessionRevision: 0,
    loadError: null, saveError: null, needsReconciliation: false,
    loadPreferences: async () => { calls.push({ action: "load" }); },
    setPreference: async (key, value) => { calls.push({ action: "set", key, value }); return true; },
    ...overrides,
  };
  const utils = { "@/lib/utils": { cn: (...classes) => classes.filter(Boolean).join(" ") } };
  const { Switch } = loadTs("../components/ui/switch.tsx", utils);
  const { Button } = loadTs("../components/ui/button.tsx", utils);
  const { Alert } = loadTs("../components/ui/alert.tsx", utils);
  const selectState = (select) => select(state);
  selectState.getState = () => state;
  const eventTarget = () => {
    const listeners = new Map();
    return {
      addEventListener: (event, listener) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(listener);
      },
      removeEventListener: (event, listener) => listeners.get(event)?.delete(listener),
      emit: (event) => { for (const listener of listeners.get(event) ?? []) listener(); },
    };
  };
  const windowMock = eventTarget();
  const documentMock = { ...eventTarget(), activeElement: null, body: {}, visibilityState: "visible" };
  const reactOverrides = {
    ...(collectEffects ? { useEffect: (effect) => { effects.push(effect); } } : {}),
    ...(collectState ? { useState: (initial) => {
      const index = localStateIndex++;
      if (!(index in localState)) localState[index] = typeof initial === "function" ? initial() : initial;
      return [localState[index], (value) => {
        localState[index] = typeof value === "function" ? value(localState[index]) : value;
      }];
    } } : {}),
  };
  const { BalancePreferencesControls } = loadTs("../features/incomes/components/BalancePreferencesControls.tsx", {
    ...utils,
    ...(collectEffects || collectState ? { react: { ...require("react"), ...reactOverrides } } : {}),
    "@/components/ui/alert": { Alert },
    "@/components/ui/button": { Button: (props) => { buttons.push(props); return createElement(Button, props); } },
    "@/components/ui/modal-panel": { ModalPanel: (props) => { modals.push(props); return createElement("section", { role: "dialog", "aria-label": props.title }, props.children); } },
    "@/components/ui/switch": { Switch: (props) => { controls.push(props); return createElement(Switch, props); } },
    "@/features/incomes/store/useBalancePreferencesStore": { useBalancePreferencesStore: selectState },
  }, { document: documentMock, window: windowMock, HTMLElement: class Element {} });
  return {
    state, calls, controls, buttons, modals,
    markup: () => { localStateIndex = 0; return renderToStaticMarkup(createElement(BalancePreferencesControls)); },
    runEffects: () => effects.map((effect) => effect()).filter((cleanup) => typeof cleanup === "function"),
    focusWindow: () => windowMock.emit("focus"),
    setVisibility: (visibility) => { documentMock.visibilityState = visibility; documentMock.emit("visibilitychange"); },
  };
}

test("balance preferences read uses the authenticated client and accepts only both direct booleans", async () => {
  const f = apiFixture(flags(true, false));
  assert.deepEqual(plain(await f.api.getPreferences()), flags(true, false));
  assert.deepEqual(f.calls, [{ method: "GET", path: "/api/users/balance-preferences" }]);
  for (const response of [null, [], {}, { preferences: flags() }, flags("false", false), flags(false, null), { exclude_va_from_available: false }]) {
    f.respond(response);
    await assert.rejects(f.api.getPreferences());
  }
  assert.equal(f.calls.some((call) => call.method === "PATCH"), false);
});

test("balance preference patch sends exactly the changed key including explicit false", async () => {
  const f = apiFixture(flags(false, true));
  assert.deepEqual(plain(await f.api.patchPreference("exclude_va_from_available", false)), flags(false, true));
  f.respond(flags(true, true));
  await f.api.patchPreference("exclude_vr_from_available", true);
  assert.deepEqual(f.calls, [
    { method: "PATCH", path: "/api/users/balance-preferences", data: { exclude_va_from_available: false } },
    { method: "PATCH", path: "/api/users/balance-preferences", data: { exclude_vr_from_available: true } },
  ]);
});

test("invalid patch inputs and malformed acknowledgements cannot become confirmed preferences", async () => {
  const f = apiFixture();
  for (const [key, value] of [["invalid", true], ["exclude_va_from_available", "false"], ["exclude_vr_from_available", null]]) {
    await assert.rejects(f.api.patchPreference(key, value));
  }
  assert.equal(f.calls.length, 0);
  f.respond({ exclude_va_from_available: true });
  await assert.rejects(f.api.patchPreference("exclude_va_from_available", true));
  assert.equal(f.calls.length, 1);
});

test("unloaded or failed preferences never write inferred or default values", async () => {
  const f = storeFixture({ getPreferences: async () => { throw Error("Leitura indisponível"); } });
  assert.equal(f.state().preferences, null);
  assert.equal(await f.state().setPreference("exclude_va_from_available", true), false);
  await f.state().loadPreferences();
  assert.equal(f.state().preferences, null);
  assert.ok(f.state().loadError);
  assert.equal(await f.state().setPreference("exclude_vr_from_available", false), false);
  assert.equal(f.calls.filter((call) => call.method === "patchPreference").length, 0);
});

test("simultaneous reads reuse the pending request and keep controls unavailable until confirmed", async () => {
  const pending = deferred();
  const f = storeFixture({ getPreferences: () => pending.promise });
  const first = f.state().loadPreferences();
  const second = f.state().loadPreferences();
  assert.equal(f.state().isLoading, true);
  assert.equal(await f.state().setPreference("exclude_va_from_available", true), false);
  assert.equal(f.calls.filter((call) => call.method === "getPreferences").length, 1);
  pending.resolve(flags(false, true));
  await Promise.all([first, second]);
  assert.equal(f.state().isLoading, false);
  assert.deepEqual(plain(f.state().preferences), flags(false, true));
});

test("accepted partial updates preserve the other server preference and refresh the summary revision", async () => {
  const f = storeFixture({
    getPreferences: async () => flags(true, true),
    patchPreference: async () => flags(false, true),
  });
  await f.state().loadPreferences();
  const before = f.state().revision;
  assert.equal(await f.state().setPreference("exclude_va_from_available", false), true);
  assert.deepEqual(plain(f.state().preferences), flags(false, true));
  assert.ok(f.state().revision > before);
  assert.deepEqual(f.calls.filter((call) => call.method === "patchPreference").map((call) => call.args), [["exclude_va_from_available", false]]);
});

test("pending writes block duplicate clicks and changes to the other preference", async () => {
  const pending = deferred();
  const f = storeFixture({ patchPreference: () => pending.promise });
  await f.state().loadPreferences();
  const saving = f.state().setPreference("exclude_va_from_available", true);
  assert.equal(f.state().isSaving, true);
  assert.equal(f.state().pendingKey, "exclude_va_from_available");
  assert.equal(await f.state().setPreference("exclude_va_from_available", true), false);
  assert.equal(await f.state().setPreference("exclude_vr_from_available", true), false);
  assert.equal(f.calls.filter((call) => call.method === "patchPreference").length, 1);
  pending.resolve(flags(true, false));
  assert.equal(await saving, true);
  assert.equal(f.state().isSaving, false);
  assert.equal(f.state().pendingKey, null);
});

test("a lost write response reconciles once without retrying the mutation or silently claiming success", async () => {
  let reads = 0;
  const f = storeFixture({
    getPreferences: async () => ++reads === 1 ? flags() : flags(true, false),
    patchPreference: async () => { throw Error("Resposta perdida"); },
  });
  await f.state().loadPreferences();
  const before = f.state().revision;
  assert.equal(await f.state().setPreference("exclude_va_from_available", true), false);
  assert.equal(f.state().pendingKey, null);
  assert.equal(reads, 2);
  assert.equal(f.calls.filter((call) => call.method === "patchPreference").length, 1);
  assert.deepEqual(plain(f.state().preferences), flags(true, false));
  assert.ok(f.state().saveError);
  assert.equal(f.state().needsReconciliation, false);
  assert.ok(f.state().revision > before);
});

test("failed reconciliation retains an explicit failure and blocks writes until a fresh read succeeds", async () => {
  let fail = false;
  const f = storeFixture({
    getPreferences: async () => { if (fail) throw Error("Falha ao conferir"); return flags(); },
    patchPreference: async () => { fail = true; throw Error("Resposta perdida"); },
  });
  await f.state().loadPreferences();
  assert.equal(await f.state().setPreference("exclude_vr_from_available", true), false);
  assert.equal(f.state().pendingKey, null);
  assert.equal(f.state().needsReconciliation, true);
  assert.ok(f.state().saveError || f.state().loadError);
  assert.equal(await f.state().setPreference("exclude_va_from_available", true), false);
  assert.equal(f.calls.filter((call) => call.method === "patchPreference").length, 1);
  fail = false;
  await f.state().loadPreferences();
  assert.equal(f.state().needsReconciliation, false);
  assert.deepEqual(plain(f.state().preferences), flags());
});

test("a late read from another account cannot replace the current account preferences", async () => {
  const old = deferred();
  let reads = 0;
  const f = storeFixture({ getPreferences: () => ++reads === 1 ? old.promise : Promise.resolve(flags(false, true)) });
  const first = f.state().loadPreferences();
  await settle();
  assert.equal(reads, 1);
  f.changeAccount();
  await f.state().loadPreferences();
  old.resolve(flags(true, false));
  await first;
  assert.deepEqual(plain(f.state().preferences), flags(false, true));
  assert.equal(f.state().isLoading, false);
});

test("a late write cannot publish preferences or summary refresh into another account", async () => {
  const pending = deferred();
  const f = storeFixture({ patchPreference: () => pending.promise });
  await f.state().loadPreferences();
  const saving = f.state().setPreference("exclude_va_from_available", true);
  f.changeAccount();
  await f.state().loadPreferences();
  const revision = f.state().revision;
  pending.resolve(flags(true, false));
  assert.equal(await saving, false);
  assert.deepEqual(plain(f.state().preferences), flags());
  assert.equal(f.state().revision, revision);
  assert.equal(f.state().isSaving, false);
});

test("same-token session replacement invalidates a pending response through the session epoch", async () => {
  const old = deferred();
  let reads = 0;
  const f = storeFixture({ getPreferences: () => ++reads === 1 ? old.promise : Promise.resolve(flags(false, true)) });
  const reading = f.state().loadPreferences();
  await settle();
  assert.equal(reads, 1);
  f.changeEpoch();
  await f.state().loadPreferences();
  old.resolve(flags(true, false));
  await reading;
  assert.deepEqual(plain(f.state().preferences), flags(false, true));
});

test("an old unauthorized write cannot log out the account that replaced its session", async () => {
  const pending = deferred();
  const f = storeFixture({ patchPreference: () => pending.promise });
  await f.state().loadPreferences();
  const saving = f.state().setPreference("exclude_va_from_available", true);
  f.changeAccount();
  await f.state().loadPreferences();
  pending.reject(http(401));
  assert.equal(await saving, false);
  assert.equal(f.logoutMessages.length, 0);
  assert.deepEqual(plain(f.state().preferences), flags());
});

test("server available totals are never reduced a second time and keep the complete income, expense and benefit cards", () => {
  for (const [va, vr, available] of [[false, false, 1125], [true, false, 1000], [false, true, 1075], [true, true, 950]]) {
    const response = {
      month: 11, year: 2026, total_income: 1725, total_expense: 600,
      total_geral_disponivel: available, va: 725, vr: 50,
      total_gasto_va: 600, total_gasto_vr: 0, restante_va: 125, restante_vr: 50,
      ...flags(va, vr),
    };
    const result = withSummaryBenefits(response, 11, 2026);
    assert.equal(result.total_geral_disponivel, available);
    assert.equal(result.total_income, 1725);
    assert.equal(result.total_expense, 600);
    assert.equal(result.va, 725);
    assert.equal(result.total_gasto_va, 600);
    assert.equal(result.restante_va, 125);
    assert.equal(result.vr, 50);
    assert.equal(result.exclude_va_from_available, va);
    assert.equal(result.exclude_vr_from_available, vr);
    assert.equal(response.total_geral_disponivel, available);
  }
  const negative = withSummaryBenefits({
    month: 11, year: 2026, total_income: 750, total_expense: 800,
    total_geral_disponivel: 25, va: 725, total_gasto_va: 800, restante_va: -75,
    ...flags(true, false),
  }, 11, 2026);
  assert.equal(negative.restante_va, -75);
  assert.equal(negative.total_geral_disponivel, 25);
  assert.equal(negative.total_expense, 800);
});

test("legacy summaries default missing flags only in memory and reject malformed preference values", () => {
  const legacy = Object.freeze({
    month: 11, year: 2026, total_income: 1725, total_expense: 600,
    total_geral_disponivel: 1125,
  });
  const result = withSummaryBenefits(legacy, 11, 2026);
  assert.equal(result.exclude_va_from_available, false);
  assert.equal(result.exclude_vr_from_available, false);
  assert.equal("exclude_va_from_available" in legacy, false);
  assert.equal("exclude_vr_from_available" in legacy, false);
  assert.equal(result.total_geral_disponivel, 1125);
  for (const key of ["exclude_va_from_available", "exclude_vr_from_available"]) {
    for (const value of [null, 0, 1, "false", "true", {}, []]) {
      assert.throws(() => withSummaryBenefits({ ...legacy, [key]: value }, 11, 2026));
    }
  }
});

test("a late report response from another account cannot replace the new account summary or supporting data", async () => {
  const previous = deferred();
  let reads = 0;
  const current = reportSummary(11, 2026, flags(false, true), 1075);
  const f = reportsFixture({ getSummary: () => ++reads === 1 ? previous.promise : Promise.resolve(current) });
  const oldRequest = f.state().loadReports(11, 2026);
  f.changeAccount();
  await f.state().loadReports(11, 2026);
  previous.resolve(reportSummary(11, 2026, flags(true, false), 1000));
  await oldRequest;
  assert.deepEqual(plain(f.state().summary), current);
  assert.equal(f.state().categories[0].category_name, "account-B");
  assert.equal(f.state().sessionEpoch, f.epoch());
  assert.equal(f.state().isLoading, false);
});

test("opening reports in a replacement session clears every cached private dataset before the new response arrives", async () => {
  const f = reportsFixture();
  await f.state().loadReports(11, 2026);
  assert.ok(f.state().summary);
  assert.ok(f.state().categories.length);
  const current = deferred();
  f.handlers.getSummary = () => current.promise;
  f.changeAccount();
  const loading = f.state().loadReports(11, 2026);
  assert.equal(f.state().summary, null);
  assert.deepEqual(plain(f.state().categories), []);
  assert.deepEqual(plain(f.state().chartData), []);
  assert.equal(f.state().yearlySummary, null);
  assert.equal(f.state().sessionEpoch, null);
  assert.equal(f.state().isLoading, true);
  current.resolve(reportSummary(11, 2026, flags(true, true), 950));
  await loading;
  assert.equal(f.state().sessionEpoch, f.epoch());
  assert.equal(f.state().summary.total_geral_disponivel, 950);
});

test("refreshing the same report period preserves its confirmed snapshot through pending reads and failure while another period clears it", async () => {
  const f = reportsFixture();
  await f.state().loadReports(11, 2026);
  const snapshot = {
    summary: f.state().summary,
    categories: f.state().categories,
    chartData: f.state().chartData,
    yearlySummary: f.state().yearlySummary,
  };
  const refresh = deferred();
  f.handlers.getSummary = () => refresh.promise;
  const refreshing = f.state().loadReports(11, 2026);
  assert.equal(f.state().isLoading, true);
  for (const [key, value] of Object.entries(snapshot)) assert.strictEqual(f.state()[key], value);
  assert.equal(f.state().sessionEpoch, f.epoch());
  refresh.reject(Error("Atualização indisponível"));
  await refreshing;
  assert.equal(f.state().isLoading, false);
  assert.match(f.state().error, /Atualização indisponível/);
  for (const [key, value] of Object.entries(snapshot)) assert.strictEqual(f.state()[key], value);
  assert.equal(f.state().sessionEpoch, f.epoch());

  const nextPeriod = deferred();
  f.handlers.getSummary = () => nextPeriod.promise;
  const changingPeriod = f.state().loadReports(12, 2026);
  assert.equal(f.state().isLoading, true);
  assert.equal(f.state().summary, null);
  assert.deepEqual(plain(f.state().categories), []);
  assert.deepEqual(plain(f.state().chartData), []);
  assert.equal(f.state().yearlySummary, null);
  assert.equal(f.state().sessionEpoch, null);
  nextPeriod.reject(Error("Novo período indisponível"));
  await changingPeriod;
  assert.equal(f.state().isLoading, false);
  assert.equal(f.state().summary, null);
  assert.deepEqual(plain(f.state().categories), []);
  assert.deepEqual(plain(f.state().chartData), []);
  assert.equal(f.state().yearlySummary, null);
  assert.match(f.state().error, /Novo período indisponível/);
});

test("December reports cannot overwrite January after a period switch and retain server preference flags and totals", async () => {
  const december = deferred(), january = deferred();
  const f = reportsFixture({ getSummary: (month) => month === 12 ? december.promise : january.promise });
  const oldRequest = f.state().loadReports(12, 2026);
  const currentRequest = f.state().loadReports(1, 2027);
  january.resolve(reportSummary(1, 2027, flags(true, false), 1000));
  await currentRequest;
  december.resolve(reportSummary(12, 2026, flags(false, false), 1125));
  await oldRequest;
  assert.equal(f.state().summary.month, 1);
  assert.equal(f.state().summary.year, 2027);
  assert.equal(f.state().summary.exclude_va_from_available, true);
  assert.equal(f.state().summary.exclude_vr_from_available, false);
  assert.equal(f.state().summary.total_geral_disponivel, 1000);
  assert.equal(f.state().summary.total_income, 1725);
  assert.equal(f.state().summary.total_expense, 600);
  assert.equal(f.state().summary.restante_va, 125);
});

test("a stale report failure cannot clear a new session even when the replacement reuses the same token", async () => {
  const previous = deferred();
  let reads = 0;
  const f = reportsFixture({ getSummary: () => ++reads === 1 ? previous.promise : Promise.resolve(reportSummary(11, 2026, flags(true, true), 950)) });
  const oldRequest = f.state().loadReports(11, 2026);
  f.changeAccount("account-A");
  await f.state().loadReports(11, 2026);
  previous.reject(http(401));
  await oldRequest;
  assert.equal(f.state().summary.total_geral_disponivel, 950);
  assert.equal(f.state().summary.exclude_va_from_available, true);
  assert.equal(f.state().error, null);
  assert.equal(f.state().isLoading, false);
  assert.equal(f.state().sessionEpoch, f.epoch());
});

test("session epoch alone rejects old preferences and reports before replacement-session requests begin", async () => {
  const preferenceResponse = deferred();
  const preferenceFixture = storeFixture({ getPreferences: () => preferenceResponse.promise });
  const preferenceRead = preferenceFixture.state().loadPreferences();
  await settle();
  preferenceFixture.changeEpoch();
  preferenceResponse.resolve(flags(true, true));
  await preferenceRead;
  assert.equal(preferenceFixture.state().preferences, null);

  const reportResponse = deferred();
  const reportFixture = reportsFixture({ getSummary: () => reportResponse.promise });
  const reportRead = reportFixture.state().loadReports(11, 2026);
  reportFixture.changeAccount("account-A");
  reportResponse.resolve(reportSummary(11, 2026, flags(true, true), 950));
  await reportRead;
  assert.equal(reportFixture.state().summary, null);
  assert.deepEqual(plain(reportFixture.state().categories), []);
  assert.deepEqual(plain(reportFixture.state().chartData), []);
  assert.equal(reportFixture.state().yearlySummary, null);
  assert.equal(reportFixture.state().sessionEpoch, null);
});

test("available balance captions use the flags of their own snapshot for all combinations without changing any values", () => {
  const { getBalanceExclusionLabel, getAvailableBalanceHint } = loadTs("../features/summary/utils/availableBalancePresentation.ts");
  for (const [va, vr, label] of [[false, false, null], [true, false, "sem VA"], [false, true, "sem VR"], [true, true, "sem VA e VR"]]) {
    const snapshot = Object.freeze({ total_geral_disponivel: 1000.25, ...flags(va, vr) });
    assert.equal(getBalanceExclusionLabel(snapshot), label);
    const hint = getAvailableBalanceHint(snapshot);
    assert.doesNotMatch(hint, /negativo|R\$|1\.000,25|1000\.25/);
    if (label) assert.ok(hint.includes(label));
    else assert.doesNotMatch(hint, /sem VA|sem VR/);
    assert.equal(snapshot.total_geral_disponivel, 1000.25);
    assert.equal(snapshot.exclude_va_from_available, va);
    assert.equal(snapshot.exclude_vr_from_available, vr);
  }
});

test("negative and legacy available captions preserve the existing financial and privacy boundaries", () => {
  const { getBalanceExclusionLabel, getAvailableBalanceHint } = loadTs("../features/summary/utils/availableBalancePresentation.ts");
  const negative = Object.freeze({ total_geral_disponivel: -24.51, ...flags(true, false) });
  assert.match(getAvailableBalanceHint(negative), /negativo/);
  assert.match(getAvailableBalanceHint(negative), /sem VA/);
  assert.doesNotMatch(getAvailableBalanceHint(negative), /24[,.]51/);
  assert.equal(negative.total_geral_disponivel, -24.51);
  const legacy = Object.freeze({ total_geral_disponivel: 0 });
  assert.equal(getBalanceExclusionLabel(legacy), null);
  assert.doesNotMatch(getAvailableBalanceHint(legacy), /negativo|sem VA|sem VR/);

  let hidden = true;
  const { FinancialValue } = loadTs("../components/ui/financial-value.tsx", {
    "@/lib/formatters": { formatMoney: (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) },
    "@/store/useFinancialPrivacyStore": { useFinancialPrivacyStore: (select) => select({ valuesHidden: hidden }) },
  });
  const privateMarkup = renderToStaticMarkup(createElement(FinancialValue, { value: negative.total_geral_disponivel }));
  assert.match(privateMarkup, /Valor oculto/);
  assert.doesNotMatch(privateMarkup, /R\$|24[,.]51/);
  hidden = false;
  assert.match(renderToStaticMarkup(createElement(FinancialValue, { value: negative.total_geral_disponivel })), /24,51/);
});

test("unavailable preferences never present two unchecked switches or trigger default writes", () => {
  for (const loadError of [null, "Backend indisponível"]) {
    const f = controlsFixture({ loadError });
    const markup = f.markup();
    assert.doesNotMatch(markup, /role="switch"|aria-checked=/);
    assert.equal(f.controls.length, 0);
    assert.equal(f.calls.length, 0);
    if (loadError) assert.ok(markup.includes(loadError));
  }
});

test("confirmed VA and VR controls have independent accessible states and dispatch only their own boolean change", () => {
  for (const [va, vr] of [[true, false], [false, true]]) {
    const f = controlsFixture({ preferences: flags(va, vr) });
    const markup = f.markup();
    const buttons = markup.match(/<button\b[^>]*role="switch"[^>]*>/g) ?? [];
    assert.equal(buttons.length, 2);
    assert.equal(f.controls.length, 2);
    assert.match(buttons[0], /aria-label="[^"]*VA[^"]*"/);
    assert.match(buttons[1], /aria-label="[^"]*VR[^"]*"/);
    assert.ok(buttons[0].includes(`aria-checked="${va}"`));
    assert.ok(buttons[1].includes(`aria-checked="${vr}"`));
    assert.equal(f.controls[0].disabled, false);
    assert.equal(f.controls[1].disabled, false);
    f.controls[0].onCheckedChange(!va);
    f.controls[1].onCheckedChange(!vr);
    assert.deepEqual(f.calls, [
      { action: "set", key: "exclude_va_from_available", value: !va },
      { action: "set", key: "exclude_vr_from_available", value: !vr },
    ]);
  }
});

test("busy controls preserve confirmed switch state while preventing actions and uncertain cached values remain disabled", () => {
  for (const busy of [{ isLoading: true }, { isSaving: true, pendingKey: "exclude_va_from_available" }]) {
    const f = controlsFixture({ preferences: flags(true, false), ...busy });
    const markup = f.markup();
    assert.match(markup, /aria-busy="true"/);
    const buttons = markup.match(/<button\b[^>]*role="switch"[^>]*>/g) ?? [];
    assert.equal(buttons.length, 2);
    assert.ok(buttons.every((button) => button.includes("disabled=")));
    assert.equal(f.controls[0].checked, true);
    assert.equal(f.controls[1].checked, false);
    f.controls[0].onCheckedChange(false);
    f.controls[1].onCheckedChange(true);
    assert.equal(f.calls.length, 0);
  }
  for (const unavailable of [{ loadError: "Backend indisponível" }, { needsReconciliation: true, saveError: "Alteração não confirmada" }]) {
    const f = controlsFixture({ preferences: flags(true, false), ...unavailable });
    const markup = f.markup();
    const buttons = markup.match(/<button\b[^>]*role="switch"[^>]*>/g) ?? [];
    assert.equal(buttons.length, 2);
    assert.ok(buttons.every((button) => button.includes("disabled=")));
    assert.ok(f.controls.every((control) => control.disabled));
    f.controls[0].onCheckedChange(false);
    f.controls[1].onCheckedChange(true);
    assert.equal(f.calls.length, 0);
  }
});

test("background preference revalidation preserves the existing structure, text and label targets without inserting a loading status", () => {
  const idle = controlsFixture({ preferences: flags(true, false) });
  const refreshing = controlsFixture({ preferences: flags(true, false), isLoading: true });
  const idleMarkup = idle.markup();
  const refreshMarkup = refreshing.markup();
  const structure = (markup) => Array.from(markup.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/gi), (match) => `${match[1]}${match[2]}`);
  const labelTargets = (markup) => Array.from(markup.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g), (match) => match[1]);
  const switchIds = (markup) => (markup.match(/<button\b[^>]*role="switch"[^>]*>/g) ?? []).map((button) => button.match(/\bid="([^"]+)"/)?.[1]);

  assert.deepEqual(structure(refreshMarkup), structure(idleMarkup));
  assert.equal(refreshMarkup.replace(/<[^>]*>/g, ""), idleMarkup.replace(/<[^>]*>/g, ""));
  assert.doesNotMatch(idleMarkup, /role="status"/);
  assert.doesNotMatch(refreshMarkup, /role="status"/);
  assert.equal(switchIds(refreshMarkup).length, 2);
  assert.deepEqual(switchIds(refreshMarkup), switchIds(idleMarkup));
  assert.deepEqual(labelTargets(refreshMarkup), switchIds(refreshMarkup));
  assert.deepEqual(labelTargets(idleMarkup), switchIds(idleMarkup));
  assert.ok(refreshing.controls.every((control) => control.disabled));
  refreshing.controls[0].onCheckedChange(false);
  refreshing.controls[1].onCheckedChange(true);
  assert.equal(refreshing.calls.length, 0);
});

test("initial preference loading reports progress without representing unknown preferences as unchecked switches", () => {
  const f = controlsFixture({ isLoading: true });
  const markup = f.markup();
  assert.match(markup, /role="status"/);
  assert.doesNotMatch(markup, /role="switch"|aria-checked=/);
  assert.equal(f.controls.length, 0);
  assert.equal(f.calls.length, 0);
});

test("mounting reads preferences once while window focus and document visibility never refresh controls or retry failed reads", () => {
  const f = controlsFixture({ preferences: flags(true, false) }, { collectEffects: true });
  f.markup();
  const cleanups = f.runEffects();
  assert.deepEqual(f.calls, [{ action: "load" }]);
  for (let index = 0; index < 3; index++) {
    f.setVisibility("hidden");
    f.focusWindow();
    f.setVisibility("visible");
    f.focusWindow();
  }
  assert.deepEqual(f.calls, [{ action: "load" }]);
  for (const cleanup of cleanups.reverse()) cleanup();

  for (const failure of [{ loadError: "Leitura indisponível" }, { needsReconciliation: true, saveError: "Alteração não confirmada" }]) {
    const failed = controlsFixture(failure, { collectEffects: true });
    failed.markup();
    const failedCleanups = failed.runEffects();
    assert.equal(failed.calls.length, 0);
    failed.setVisibility("hidden");
    failed.setVisibility("visible");
    failed.focusWindow();
    assert.equal(failed.calls.length, 0);
    const retryButtons = failed.buttons.filter((button) => button["aria-haspopup"] !== "dialog");
    assert.equal(retryButtons.length, 1);
    assert.equal(retryButtons[0].disabled, false);
    retryButtons[0].onClick();
    assert.deepEqual(failed.calls, [{ action: "load" }]);
    for (const cleanup of failedCleanups.reverse()) cleanup();
  }
});

test("the detailed balance explanation stays in the help dialog and opening or closing it never reads or writes preferences", () => {
  const preferences = Object.freeze(flags(true, false));
  const f = controlsFixture({ preferences }, { collectState: true });
  const closedMarkup = f.markup();
  const helpButton = f.buttons.find((button) => button["aria-haspopup"] === "dialog");
  assert.ok(helpButton);
  assert.equal(helpButton["aria-expanded"], false);
  assert.doesNotMatch(closedMarkup, /role="dialog"/);
  assert.equal(f.modals.length, 0);
  helpButton.onClick();
  const openMarkup = f.markup();
  assert.match(openMarkup, /role="dialog"/);
  assert.equal(f.modals.length, 1);
  const expandedHelp = f.buttons.filter((button) => button["aria-haspopup"] === "dialog").at(-1);
  assert.equal(expandedHelp["aria-expanded"], true);
  const details = renderToStaticMarkup(createElement("div", null, f.modals[0].children)).replace(/<[^>]*>/g, "").trim();
  assert.ok(details.length > 0);
  assert.equal(closedMarkup.replace(/<[^>]*>/g, "").includes(details), false);
  assert.strictEqual(f.state.preferences, preferences);
  assert.deepEqual(f.state.preferences, flags(true, false));
  assert.equal(f.calls.length, 0);
  f.modals[0].onClose();
  const closedAgain = f.markup();
  assert.doesNotMatch(closedAgain, /role="dialog"/);
  assert.strictEqual(f.state.preferences, preferences);
  assert.equal(f.calls.length, 0);
});
