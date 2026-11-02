import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as paymentSources from "../lib/payment-sources.ts";
import * as presentation from "../features/expenses/utils/expensePresentation.ts";

const require = createRequire(import.meta.url);
function loadCard(path, name) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const mocks = {
    "@/lib/payment-sources": paymentSources,
    "@/features/expenses/utils/expensePresentation": presentation,
    "@/components/ui/financial-value": { FinancialValue: "financial-value" },
  };
  vm.runInNewContext(`${code}\nexports.CardUnderTest = ${name};`, {
    exports,
    require: (id) => id in mocks ? mocks[id] : id.startsWith("@/") ? {} : require(id),
  });
  return exports.CardUnderTest;
}

const cards = [
  loadCard("../features/expenses/components/CompactExpenseCard.tsx", "CompactExpenseCard"),
  loadCard("../features/expenses/components/ExpensesView.tsx", "ExpenseCard"),
];
const expense = {
  id: 12, description: "Compra de teste", date: "2026-11-05", advanced_at: "2026-10-05",
  is_advanced: false, is_paid: false, paid_at: null, amount: 59.95, notes: null,
  payment_source: "Salario", type: "Única", installments: 5, current_installment: 2,
};
const props = {
  categoryName: "Categoria de teste", isAdvanceStatusUpdating: false, isPaymentStatusUpdating: false,
  onView() {}, onDelete() {}, onAdvance() {}, onEdit() {}, onTogglePaid() {},
};

function descendants(node) {
  if (Array.isArray(node)) return node.flatMap(descendants);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...descendants(node.props.children)];
}
function indicators(tree) {
  return descendants(tree).filter((node) => node.props.role === "img" && node.props["aria-label"] === "Tem observações");
}

test("both card variants derive the note indicator only from nonblank notes in every expense state", () => {
  for (const Card of cards) {
    for (const type of ["Única", "Parcelada", "Fixa"]) {
      for (const isPaid of [true, false]) {
        for (const isAdvanced of [true, false]) {
          for (const notes of [undefined, null, "", " \n\t ", "Uma observação", "  Uma observação  "]) {
            const tree = Card({ ...props, expense: { ...expense, type, is_paid: isPaid, is_advanced: isAdvanced, notes } });
            assert.equal(indicators(tree).length, notes?.trim() ? 1 : 0);
          }
        }
      }
    }
  }
});

test("the indicator is informational, compact, accessible and does not expose note contents", () => {
  for (const Card of cards) {
    const notes = "Conteúdo privado que pertence aos detalhes";
    const tree = Card({ ...props, expense: { ...expense, notes } });
    const indicator = indicators(tree)[0];
    assert.equal(indicator.type, "span");
    assert.match(indicator.props.className, /h-5 w-5 shrink-0/);
    assert.match(indicator.props.className, /bg-brand\/10/);
    assert.equal(indicator.props.children.props.size, 12);
    assert.equal(String(indicator.props.children.props["aria-hidden"]), "true");
    assert.equal(indicator.props.onClick, undefined);
    assert.equal(indicator.props.tabIndex, undefined);
    for (const node of descendants(tree)) {
      assert.notEqual(node.props.title, notes);
      assert.notEqual(node.props["aria-label"], notes);
    }
    assert.equal(JSON.stringify(indicator).includes(notes), false);
  }
});

test("metadata scrolls independently while the note indicator keeps its reserved space", () => {
  for (const Card of cards) {
    const tree = Card({ ...props, expense: { ...expense, notes: "Com observações", is_advanced: true, is_paid: true } });
    const indicator = indicators(tree)[0];
    const row = descendants(tree).find((node) => Array.isArray(node.props.children) && node.props.children.includes(indicator));
    const metadata = row.props.children[0];
    assert.match(row.props.className, /gap-1\.5/);
    assert.match(metadata.props.className, /overflow-x-auto/);
    assert.match(metadata.props.className, /min-w-0/);
    assert.equal(descendants(metadata).includes(indicator), false);
  }
});

test("editing and clearing notes updates the indicator without changing card actions or view data", () => {
  for (const Card of cards) {
    let viewed;
    const render = (notes) => Card({ ...props, expense: { ...expense, notes }, onView: (value) => { viewed = value; } });
    const empty = render(null);
    const added = render("Texto completo da observação");
    const edited = render("Texto atualizado");
    const cleared = render("   ");
    assert.deepEqual([empty, added, edited, cleared].map((tree) => indicators(tree).length), [0, 1, 1, 0]);
    const actions = (tree) => descendants(tree).filter((node) => node.type === "button").map((node) => node.props["aria-label"]);
    assert.deepEqual(actions(empty), actions(added));
    assert.deepEqual(actions(empty), actions(cleared));
    descendants(added).find((node) => node.type === "button" && node.props["aria-label"].startsWith("Visualizar")).props.onClick();
    assert.equal(viewed.notes, "Texto completo da observação");
    assert.equal(viewed.id, expense.id);
  }
});
