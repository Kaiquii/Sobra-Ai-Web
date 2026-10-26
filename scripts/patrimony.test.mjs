import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const require = createRequire(import.meta.url);
function loadTs(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    setTimeout: (fn) => setTimeout(fn, 0),
    require: (name) => (name in mocks ? mocks[name] : require(name)),
  });
  return exports;
}
const money = loadTs("../features/patrimony/utils/patrimonyMoney.ts");
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const sample = () => ({
  fgts: { amount: "0", updated_at: "2026-10-26T12:00:00Z" },
  investments: [],
  total_fgts: "0",
  total_investments: "0",
  total_patrimony: "0",
});
const catalog = [
  { id: 71, name: "CDI", is_default: true },
  { id: 93, name: "Reserva", is_default: false },
];
function http(status, code) {
  return Object.assign(new Error(`HTTP ${status ?? code}`), {
    isAxiosError: true,
    ...(status ? { response: { status } } : {}),
    code,
  });
}
function storeFixture(overrides = {}) {
  let token = "account-A",
    subscriber;
  const calls = [];
  const api = {
    read: async () => {
      calls.push("read");
      return sample();
    },
    categories: async () => {
      calls.push("categories");
      return catalog;
    },
    write: async (action) => {
      calls.push(action);
      return null;
    },
    ...overrides,
  };
  const auth = {
    subscribe: (fn) => {
      subscriber = fn;
    },
    getState: () => ({
      logout: () => {
        token = null;
        subscriber({ isAuthenticated: false }, {});
      },
    }),
  };
  const store = loadTs("../features/patrimony/store/usePatrimonyStore.ts", {
    "@/features/auth/store/useAuthStore": { useAuthStore: auth },
    "@/lib/auth-cookie": { getBrowserAuthToken: () => token },
    "@/lib/api-errors": {
      getApiErrorStatus: (error) => error.response?.status,
      getApiErrorMessage: (error, fallback) => error.message || fallback,
    },
    "../api/patrimonyApi": { patrimonyApi: api },
  }).usePatrimonyStore;
  return {
    store,
    calls,
    api,
    changeAccount: () => {
      token = "account-B";
      subscriber({ isAuthenticated: true, user: { email: "b" } }, { user: { email: "a" } });
    },
  };
}

test("patrimony money preserves cents, pt-BR, zero, entry limits and larger totals", () => {
  for (const [input, cents] of [
    ["0", "0"],
    ["0,01", "1"],
    ["R$ 1.234,56", "123456"],
    ["1.234", "123400"],
    ["12.34", "1234"],
    ["9.999.999.999,99", "999999999999"],
  ]) {
    assert.equal(money.parseAmount(input), cents);
    assert.equal(money.parseAmount(money.amountInput(cents)), cents);
  }
  for (const input of [
    "",
    "-1",
    "NaN",
    "1e3",
    "1,234",
    "1.2,00",
    "1,2,3",
    "10000000000,00",
    "0.001",
  ])
    assert.throws(() => money.parseAmount(input));
  assert.equal(money.decimalToCents("9007199254740993.01"), "900719925474099301");
  assert.equal(money.formatCents("900719925474099301"), "R$ 9.007.199.254.740.993,01");
  const data = money.parseExactJson('{"total":9007199254740993.01,"name":"saldo 123 e \\"x\\""}');
  assert.equal(money.jsonNumberToken(data.total), "9007199254740993.01");
  assert.throws(() => money.jsonNumberToken("100.00"));
});

test("Unicode names count code points, trim input and reject empty/oversized names", () => {
  assert.equal(money.validatedName("  Reserva 💰  ", 120), "Reserva 💰");
  assert.equal([...money.validatedName("💰".repeat(80), 80)].length, 80);
  assert.throws(() => money.validatedName("💰".repeat(81), 80));
  assert.throws(() => money.validatedName("   ", 80));
});

test("wire contract emits decimal number without floats and only the selected category identity", async () => {
  const calls = [];
  const client = Object.fromEntries(
    ["post", "put", "patch", "delete"].map((method) => [
      method,
      async (...args) => {
        calls.push({ method, args });
        return { data: { data: catalog[1], message: "Excluído" } };
      },
    ]),
  );
  const api = loadTs("../features/patrimony/api/patrimonyApi.ts", {
    "@/lib/api": { apiClient: client },
    "../utils/patrimonyMoney": money,
  }).patrimonyApi;
  await api.write({ kind: "fgts", amount: "0" });
  await api.write({
    kind: "investment",
    draft: {
      name: "  Minha reserva  ",
      amount: "9.999.999.999,99",
      categoryId: 93,
      category: "ignored",
    },
  });
  await api.write({
    kind: "investment",
    id: 123,
    draft: { name: "Legado", amount: "0,01", category: " CDB " },
  });
  await api.write({ kind: "deleteInvestment", id: 123 });
  await api.write({ kind: "deleteFgts" });
  await api.write({ kind: "category", name: " Nova " });
  await api.write({ kind: "category", id: 93, name: " Renomeada " });
  await api.write({ kind: "deleteCategory", id: 93 });
  assert.equal(calls[0].args[1], '{"amount":0.00}');
  assert.equal(
    calls[1].args[1],
    '{"name":"Minha reserva","category_id":93,"amount":9999999999.99}',
  );
  assert.equal(calls[2].args[1], '{"name":"Legado","category":"CDB","amount":0.01}');
  assert.deepEqual(
    calls.map((call) => call.method),
    ["put", "post", "patch", "delete", "delete", "post", "patch", "delete"],
  );
  await assert.rejects(api.write({ kind: "fgts", amount: "-0,01" }));
  assert.equal(calls.length, 8);
});

test("reads validate server money, keep independent server totals and category IDs", async () => {
  let body =
    '{"fgts":{"amount":0,"updated_at":"2026-10-26T12:00:00Z"},"investments":[],"total_fgts":0,"total_investments":9007199254740993.01,"total_patrimony":9007199254740993.02}';
  const api = loadTs("../features/patrimony/api/patrimonyApi.ts", {
    "@/lib/api": {
      apiClient: { get: async (_, config) => ({ data: config.transformResponse[0](body) }) },
    },
    "../utils/patrimonyMoney": money,
  }).patrimonyApi;
  const result = await api.read();
  assert.equal(result.fgts.amount, "0");
  assert.equal(result.total_patrimony, "900719925474099302");
  const valid = body;
  body = body.replace('"amount":0', '"amount":"0.00"');
  await assert.rejects(api.read());
  body = valid;
  body = body.replace('"total_fgts":0', '"total_fgts":"bad"');
  await assert.rejects(api.read());
});

test("initial failures keep unavailable totals, refresh failures preserve previous balances", async () => {
  const { store, api } = storeFixture({
    read: async () => {
      throw http(500);
    },
  });
  await store.getState().load();
  assert.equal(store.getState().data, null);
  assert.ok(store.getState().error);
  api.read = async () => sample();
  await store.getState().load(true);
  api.read = async () => {
    throw http(503);
  };
  await store.getState().load(true);
  assert.equal(store.getState().data.fgts.amount, "0");
  assert.ok(store.getState().error);
});

test("simultaneous reads reuse in-flight work and successful reads use a 60s cache", async () => {
  const request = deferred();
  let reads = 0;
  const { store } = storeFixture({
    read: () => {
      reads++;
      return request.promise;
    },
  });
  const first = store.getState().load();
  const second = store.getState().load();
  assert.equal(first, second);
  request.resolve(sample());
  await first;
  await store.getState().load();
  assert.equal(reads, 1);
});

test("only connection GET failures retry; HTTP and timeout errors never retry", async () => {
  for (const [error, expected] of [
    [http(undefined, "ERR_NETWORK"), 4],
    [http(500), 1],
    [http(undefined, "ECONNABORTED"), 1],
    [http(409), 1],
  ]) {
    let reads = 0;
    const { store } = storeFixture({
      read: async () => {
        reads++;
        throw error;
      },
    });
    await store.getState().load();
    assert.equal(reads, expected);
  }
});

test("catalog fallback requires a read 404, is rechecked on entry, and recovers on 200", async () => {
  let reads = 0;
  const { store, api } = storeFixture({
    categories: async () => {
      reads++;
      throw http(404);
    },
  });
  await store.getState().loadCategories();
  assert.equal(store.getState().supported, false);
  await store.getState().loadCategories();
  assert.equal(reads, 2);
  api.categories = async () => catalog;
  await store.getState().loadCategories();
  assert.equal(store.getState().supported, true);
  const failed = storeFixture({
    categories: async () => {
      throw http(undefined, "ERR_NETWORK");
    },
  }).store;
  await failed.getState().loadCategories();
  assert.equal(failed.getState().supported, null);
  assert.ok(failed.getState().categoriesError);
});

test("writes reconcile both domains without changing monthly financial state and select returned ID", async () => {
  const { store, calls } = storeFixture({
    write: async (action) => {
      calls.push(action);
      return catalog[1];
    },
  });
  await store.getState().reconcile();
  const result = await store.getState().write({ kind: "category", name: "Reserva" });
  assert.equal(result.outcome, "saved");
  assert.equal(result.category.id, 93);
  assert.equal(calls.filter((call) => call === "read").length, 2);
  assert.equal(calls.filter((call) => call === "categories").length, 2);
  assert.equal("revision" in store.getState(), false);
});

test("lost mutation responses are never repeated and failed reconciliation blocks further writes", async () => {
  let writes = 0,
    fail = false;
  const { store, api } = storeFixture({
    write: async () => {
      writes++;
      fail = true;
      throw http(undefined, "ECONNABORTED");
    },
    read: async () => {
      if (fail) throw http(503);
      return sample();
    },
  });
  await store.getState().reconcile();
  const result = await store.getState().write({ kind: "fgts", amount: "0" });
  assert.equal(result.outcome, "review");
  assert.equal(writes, 1);
  assert.equal(store.getState().needsReview, true);
  assert.match(store.getState().notice, /não será repetida/);
  assert.equal((await store.getState().write({ kind: "fgts", amount: "1" })).outcome, "error");
  assert.equal(writes, 1);
  api.read = async () => sample();
  await store.getState().reconcile();
  assert.equal(store.getState().needsReview, false);
});

test("default categories are protected and in-use conflicts preserve investments", async () => {
  let writes = 0;
  const { store } = storeFixture({
    write: async () => {
      writes++;
      throw http(409);
    },
  });
  await store.getState().reconcile();
  assert.equal((await store.getState().write({ kind: "deleteCategory", id: 71 })).outcome, "error");
  assert.equal(writes, 0);
  assert.equal((await store.getState().write({ kind: "deleteCategory", id: 93 })).outcome, "error");
  assert.match(store.getState().mutationError, /preservados/);
  assert.ok(store.getState().data);
});

test("duplicate writes are blocked and late replies cannot populate another account", async () => {
  const request = deferred();
  let writes = 0;
  const { store, changeAccount } = storeFixture({
    write: () => {
      writes++;
      return request.promise;
    },
  });
  await store.getState().reconcile();
  const first = store.getState().write({ kind: "fgts", amount: "0" });
  assert.equal((await store.getState().write({ kind: "fgts", amount: "0" })).outcome, "error");
  assert.equal(writes, 1);
  changeAccount();
  request.resolve(null);
  await first;
  assert.equal(store.getState().data, null);
  assert.equal(store.getState().notice, null);
  const read = deferred();
  const fixture = storeFixture({ read: () => read.promise });
  const pending = fixture.store.getState().load();
  fixture.changeAccount();
  read.resolve(sample());
  await pending;
  assert.equal(fixture.store.getState().data, null);
});

test("401/403 revoke session and remove protected values without falling back to legacy", async () => {
  for (const status of [401, 403]) {
    const { store, api } = storeFixture();
    await store.getState().reconcile();
    api.categories = async () => {
      throw http(status);
    };
    await store.getState().loadCategories(true);
    assert.equal(store.getState().data, null);
    assert.equal(store.getState().supported, null);
    assert.equal(store.getState().categories.length, 0);
  }
});

test("visibility reads cannot reuse a pre-mutation balance during reconciliation", async () => {
  const pending = deferred();
  const { store, calls } = storeFixture({ write: () => pending.promise });
  await store.getState().reconcile();
  const saving = store.getState().write({ kind: "fgts", amount: "1,01" });
  await Promise.all([store.getState().load(true), store.getState().loadCategories(true)]);
  assert.equal(calls.filter((call) => call === "read").length, 1);
  pending.resolve(null);
  await saving;
  assert.equal(calls.filter((call) => call === "read").length, 2);
});

test("malformed mutation confirmation reconciles without permitting a duplicate write", async () => {
  const api = loadTs("../features/patrimony/api/patrimonyApi.ts", {
    "@/lib/api": { apiClient: { put: async () => ({ data: {} }) } },
    "../utils/patrimonyMoney": money,
  }).patrimonyApi;
  await assert.rejects(
    api.write({ kind: "fgts", amount: "0" }),
    (error) => error.unconfirmedWrite === true,
  );
  let writes = 0;
  const { store } = storeFixture({
    write: async () => {
      writes++;
      throw { unconfirmedWrite: true };
    },
  });
  await store.getState().reconcile();
  assert.equal((await store.getState().write({ kind: "fgts", amount: "0" })).outcome, "review");
  assert.equal(writes, 1);
  assert.equal(store.getState().needsReview, false);
  assert.match(store.getState().notice, /confirmação/);
});

test("privacy removes monetary strings from rendered text and accessible markup", () => {
  let hidden = true;
  const { PatrimonyTotals } = loadTs("../features/patrimony/components/PatrimonyCards.tsx", {
    "@/components/ui/card": {
      Card: ({ children, ...props }) => createElement("div", props, children),
    },
    "@/store/useFinancialPrivacyStore": {
      useFinancialPrivacyStore: (select) => select({ valuesHidden: hidden }),
    },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "../utils/patrimonyMoney": money,
  });
  const data = {
    ...sample(),
    total_fgts: "123456",
    total_investments: "987654",
    total_patrimony: "1111110",
  };
  const markup = renderToStaticMarkup(createElement(PatrimonyTotals, { data }));
  assert.match(markup, /Valor oculto/);
  assert.doesNotMatch(markup, /R\$|1\.234,56|9\.876,54|11\.111,10/);
  hidden = false;
  assert.match(renderToStaticMarkup(createElement(PatrimonyTotals, { data })), /11\.111,10/);
});

test("FGTS writes are independent of an unfinished category catalog read", async () => {
  const categories = deferred();
  let writes = 0;
  const { store } = storeFixture({
    categories: () => categories.promise,
    write: async () => {
      writes++;
      return null;
    },
  });
  await store.getState().load();
  const catalogRead = store.getState().loadCategories();
  const saving = store.getState().write({ kind: "fgts", amount: "0" });
  assert.equal(writes, 1);
  categories.resolve(catalog);
  await catalogRead;
  assert.equal((await saving).outcome, "saved");
});
