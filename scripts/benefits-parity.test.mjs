import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as sources from "../lib/payment-sources.ts";
import { withSummaryBenefits } from "../lib/summary-benefits.ts";
import { filterSelectOptions, selectorHeight } from "../lib/select-search.ts";

const require = createRequire(import.meta.url);
function loadTs(path, mocks) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => name in mocks ? mocks[name] : require(name) });
  return exports;
}
const incomeUtils = loadTs("../features/incomes/utils/incomeUtils.ts", { "@/lib/payment-sources": sources });

test("sources preserve benefits, aliases and unknown names independently", () => {
  for (const name of ["VA", "vale-alimentação (VA)"]) assert.equal(sources.canonicalPaymentSource(name), "VA");
  assert.equal(sources.canonicalPaymentSource("Vale Refeição"), "VR");
  assert.equal(sources.canonicalPaymentSource("Salário"), "Salario");
  assert.equal(sources.canonicalPaymentSource("Outra origem"), null);
  assert.equal(sources.paymentSourceLabel("Outra origem"), "Outra origem");
  assert.ok(sources.paymentSourcesMatch("vale-refeição (VR)", "VR"));
  assert.equal(sources.paymentSourcesMatch("VA", "VR"), false);
});

test("splits accept benefits with legacy sources, reject aliases repeated and invalid totals", () => {
  assert.ok(sources.validPaymentDistribution(150, [{ payment_source: "Salário", amount: 50 }, { payment_source: "VA", amount: 60 }, { payment_source: "VR", amount: 40 }]));
  for (const splits of [
    [{ payment_source: "VA", amount: 50 }, { payment_source: "Vale-alimentação (VA)", amount: 100 }],
    [{ payment_source: "VA", amount: -50 }, { payment_source: "VR", amount: 200 }],
    [{ payment_source: "VA", amount: 150 }, { payment_source: "VR", amount: 0 }],
    [{ payment_source: "VA", amount: 100 }, { payment_source: "VR", amount: 49 }],
    [{ payment_source: "VA", amount: NaN }, { payment_source: "VR", amount: 50 }],
  ]) assert.equal(sources.validPaymentDistribution(150, splits), false);
});

test("benefits preserve totals, negatives and compatibility without hiding contract errors", () => {
  const base = { month: 12, year: 2026, total_income: 900, total_expense: 950, total_geral_disponivel: -50 };
  const old = withSummaryBenefits(base, 12, 2026);
  assert.equal(old.va, 0);
  assert.equal(old.restante_vr, 0);
  const result = withSummaryBenefits({ ...base, va: 600, vr: 300, restante_va: -70, restante_vr: 20 }, 12, 2026);
  assert.equal(result.total_income, 900);
  assert.equal(result.total_expense, 950);
  assert.equal(result.total_geral_disponivel, -50);
  assert.equal(result.restante_va, -70);
  assert.throws(() => withSummaryBenefits({ ...base, va: "600" }, 12, 2026));
  assert.throws(() => withSummaryBenefits(base, 1, 2027));
  assert.throws(() => withSummaryBenefits({ ...base, total_income: NaN }, 12, 2026));
});

test("income lookup isolates source and period across December and January", () => {
  const incomes = [
    { id: 1, month: 12, year: 2026, source: "VA", amount: 100 },
    { id: 2, month: 1, year: 2027, source: "VA", amount: 300 },
    { id: 3, month: 1, year: 2027, source: "VR", amount: 200 },
    { id: 4, month: 1, year: 2027, source: "Outra origem", amount: 50 },
  ];
  assert.equal(incomeUtils.findIncomeByReference(incomes, "VA", 1, 2027)?.id, 2);
  assert.equal(incomeUtils.findIncomeByReference(incomes, "VR", 1, 2027)?.id, 3);
  assert.equal(incomeUtils.findIncomeByReference(incomes, "Salario", 1, 2027), undefined);
  assert.equal(incomeUtils.findIncomeByReference(incomes, "VA", 1, 2026), undefined);
});

test("recurrence is one server-owned instruction, repeat_future belongs only to extra income", () => {
  for (const source of ["Salario", "Adiantamento", "VA", "VR"]) {
    const data = incomeUtils.buildIncomeCreateRequest(source, 600, 12, 2026, true);
    assert.equal(data.type, "Fixa");
    assert.equal(data.source, source);
    assert.equal(data.month, 12);
    assert.equal(data.year, 2026);
    assert.equal("repeat_future" in data, false);
    assert.equal(incomeUtils.buildIncomeCreateRequest(source, 600, 12, 2026, false).type, "Única");
  }
  assert.equal(incomeUtils.buildIncomeCreateRequest("Renda Extra", 100, 1, 2027, true).repeat_future, true);
  assert.equal(incomeUtils.buildIncomeCreateRequest("Renda Extra", 100, 1, 2027, false).repeat_future, false);
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function incomeStore(api) {
  return loadTs("../features/incomes/store/useIncomeStore.ts", {
    "@/features/incomes/api/incomesApi": { incomesApi: api },
    "@/lib/api-errors": { getApiErrorMessage: (error) => error.message },
  }).useIncomeStore;
}

test("late income response cannot overwrite a new period", async () => {
  const december = deferred(), january = deferred();
  const store = incomeStore({ getIncomes: (month) => month === 12 ? december.promise : january.promise });
  const old = store.getState().loadIncomes(12, 2026);
  const current = store.getState().loadIncomes(1, 2027);
  january.resolve({ incomes: [{ id: 2, month: 1, year: 2027, source: "VA" }], total: 1 });
  await current;
  december.resolve({ incomes: [{ id: 1, month: 12, year: 2026, source: "VR" }], total: 1 });
  await old;
  assert.equal(store.getState().incomes[0].id, 2);
  assert.equal(store.getState().reference.year, 2027);
  assert.equal(store.getState().isLoading, false);
});

test("failed writes never publish success or a successful revision", async () => {
  const store = incomeStore({ createIncome: async () => { throw Error("Falha na gravação"); } });
  await assert.rejects(store.getState().createIncome({ source: "VA", amount: 100, month: 1, year: 2027, type: "Fixa" }), /Falha/);
  assert.equal(store.getState().revision, 0);
  assert.equal(store.getState().message, null);
  assert.equal(store.getState().isSubmitting, false);
  assert.match(store.getState().error, /Falha/);
});

test("update and delete retain ID and future scope and reload the current period", async () => {
  const calls = [];
  const store = incomeStore({
    getIncomes: async (month, year) => { calls.push(["load", month, year]); return { incomes: [], total: 0 }; },
    updateIncome: async (id, data) => { calls.push(["update", id, { ...data }]); return { message: "Atualizada" }; },
    deleteIncome: async (id, future) => { calls.push(["delete", id, future]); return { message: "Excluída" }; },
  });
  await store.getState().loadIncomes(1, 2027);
  await store.getState().updateIncome(22, { amount: 650, update_future: true });
  await store.getState().deleteIncome(23, false);
  assert.deepEqual(calls, [["load", 1, 2027], ["update", 22, { amount: 650, update_future: true }], ["load", 1, 2027], ["delete", 23, false], ["load", 1, 2027]]);
  assert.equal(store.getState().revision, 2);
});

test("selector search preserves identities and order with accents, terms and repeated names", () => {
  const options = [{ value: "1", label: "Vale-alimentação" }, { value: "2", label: "Casa" }, { value: "3", label: "Casa" }, { value: "4", label: "Vale-refeição" }];
  assert.deepEqual(filterSelectOptions(options, "ALIMENTACAO vale"), [options[0]]);
  assert.deepEqual(filterSelectOptions(options, "casa").map((option) => option.value), ["2", "3"]);
  assert.deepEqual(filterSelectOptions(options, "sem resultado"), []);
  assert.strictEqual(filterSelectOptions(options, ""), options);
  assert.equal(selectorHeight(0), 184);
  assert.equal(selectorHeight(100), 472);
});

test("pending writes block duplicate submissions without sending another request", async () => {
  const pending = deferred();
  let count = 0;
  const store = incomeStore({ createIncome: () => { count++; return pending.promise; } });
  const data = incomeUtils.buildIncomeCreateRequest("VA", 600, 1, 2027);
  const first = store.getState().createIncome(data);
  await assert.rejects(store.getState().createIncome(data), /Aguarde/);
  assert.equal(count, 1);
  pending.resolve({ message: "Criada" });
  await first;
  assert.equal(store.getState().revision, 1);
});

test("a reload failure after a successful write is visible and never repeats the mutation", async () => {
  let failReload = false, writes = 0;
  const store = incomeStore({
    getIncomes: async () => { if (failReload) throw Error("Falha na atualização"); return { incomes: [], total: 0 }; },
    createIncome: async () => { writes++; failReload = true; return { message: "Criada" }; },
  });
  await store.getState().loadIncomes(1, 2027);
  await store.getState().createIncome(incomeUtils.buildIncomeCreateRequest("VR", 200, 1, 2027));
  assert.equal(writes, 1);
  assert.equal(store.getState().revision, 1);
  assert.match(store.getState().error, /atualização/);
});

test("late expense loads cannot replace current expenses or their effective period", async () => {
  const december = deferred(), january = deferred();
  const store = loadTs("../features/expenses/store/useExpenseStore.ts", {
    "@/features/expenses/api/expensesApi": { expensesApi: {
      getCategories: async () => ({ categories: [] }),
      getExpenses: (month) => month === 12 ? december.promise : january.promise,
    } },
    "@/lib/api-errors": { getApiErrorMessage: (error) => error.message },
  }).useExpenseStore;
  const old = store.getState().loadInitialData(12, 2026);
  const current = store.getState().loadInitialData(1, 2027);
  january.resolve({ expenses: [{ id: 2, is_advanced: true, advanced_at: "2027-01-03" }], total: 20 });
  await current;
  december.resolve({ expenses: [{ id: 1, is_advanced: true, advanced_at: "2026-12-03" }], total: 10 });
  await old;
  assert.equal(store.getState().expenses[0].id, 2);
  assert.equal(store.getState().advancedExpenses[0].id, 2);
  assert.equal(store.getState().total, 20);
});
