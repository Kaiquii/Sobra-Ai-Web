import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { paymentSourceLabel } from "../lib/payment-sources.ts";

const require = createRequire(import.meta.url);
function loadDialog(name) {
  const source = readFileSync(new URL(`../features/expenses/components/${name}.tsx`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mocks = {
    react: { useMemo: (factory) => factory(), useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}] },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/date-picker": { DatePicker: "date-picker" },
    "@/components/ui/label": { Label: "label" },
    "@/components/ui/financial-value": { FinancialValue: "financial-value" },
    "@/components/ui/use-lock-body-scroll": { useLockBodyScroll: () => {} },
    "@/lib/payment-sources": { paymentSourceLabel },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: (id) => id in mocks ? mocks[id] : require(id) });
  return exports[name];
}

const advanceDialog = loadDialog("ExpenseAdvanceDialog");
const detailsDialog = loadDialog("ExpenseDetailsDialog");
const expense = {
  id: 12, description: "Despesa de teste", date: "2026-11-05", advanced_at: "2026-10-05",
  is_advanced: true, is_paid: true, paid_at: "2026-10-04T08:34:00Z", amount: 59.95,
  payment_source: "Salario", type: "Única", installments: 1,
};

function descendants(node) {
  if (Array.isArray(node)) return node.flatMap(descendants);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...descendants(node.props.children)];
}

test("removal belongs to the date dialog only for an already advanced expense", () => {
  let removals = 0;
  const props = { expense, isSubmitting: false, onClose() {}, onConfirm() {}, onRemoveAdvance() { removals++; } };
  const remove = descendants(advanceDialog(props)).find((node) => node.type === "button" && node.props.children?.includes?.("Remover adiantamento"));
  assert.ok(remove);
  assert.equal(remove.props.disabled, false);
  remove.props.onClick();
  assert.equal(removals, 1);
  assert.equal(descendants(advanceDialog({ ...props, expense: { ...expense, is_advanced: false } })).some((node) => node.props.onClick === props.onRemoveAdvance), false);
  assert.equal(advanceDialog({ ...props, expense: null }), null);
});

test("updating blocks removal and duplicate date submission, preserving the selected date", () => {
  let confirmations = 0;
  const tree = advanceDialog({ expense, isSubmitting: true, onClose() {}, onConfirm() { confirmations++; }, onRemoveAdvance() {} });
  assert.ok(descendants(tree).filter((node) => node.type === "button").every((node) => node.props.disabled));
  tree.props.children.props.onSubmit({ preventDefault() {} });
  assert.equal(confirmations, 0);
  assert.equal(descendants(tree).find((node) => node.type === "date-picker").props.value, "2026-10-05");
});

test("details are informational and retain the planning and paid dates without removal", () => {
  const tree = detailsDialog({ expense, categoryName: "Comida", onClose() {} });
  const panes = descendants(tree);
  const mobile = panes.find((node) => "data-mobile-expense-details" in node.props);
  const desktop = panes.find((node) => "data-desktop-expense-details" in node.props);
  const desktopNodes = descendants(desktop);
  assert.equal(descendants(mobile).filter((node) => node.type === "button").length, 1);
  assert.equal(descendants(mobile).find((node) => node.type === "button").props.children, "Fechar");
  assert.match(mobile.props.className, /sm:hidden/);
  assert.match(desktop.props.className, /sm:flex/);
  assert.equal(desktopNodes.filter((node) => node.type === "button").length, 1);
  assert.ok(desktopNodes.some((node) => node.props.label === "Considerada no planejamento" && node.props.value === "05/10/2026"));
  assert.ok(desktopNodes.some((node) => node.props.label === "Status de pagamento"));
});

test("compact details preserve split values, installments, long notes and closing without editing actions", () => {
  const notes = "Observação longa com mais detalhes. ".repeat(100);
  let closes = 0;
  const tree = detailsDialog({
    expense: { ...expense, type: "Parcelada", current_installment: 2, installments: 5, notes, payment_splits: [{ payment_source: "VA", amount: 30 }, { payment_source: "VR", amount: 29.95 }] },
    categoryName: "Categoria com um nome muito comprido", onClose() { closes++; },
  });
  const mobile = descendants(tree).find((node) => "data-mobile-expense-details" in node.props);
  const nodes = descendants(mobile);
  assert.deepEqual(nodes.filter((node) => node.type === "financial-value").map((node) => node.props.value), [59.95, 30, 29.95]);
  assert.ok(nodes.some((node) => node.props.children === notes.trim() && node.props.className.includes("overflow-y-auto")));
  assert.ok(nodes.some((node) => node.props.role === "progressbar" && node.props["aria-valuenow"] === 2 && node.props["aria-valuemax"] === 5));
  nodes.find((node) => node.type === "button").props.onClick();
  assert.equal(closes, 1);
});

test("compact dialog geometry and actions are confined to the mobile media query", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const mobile = css.slice(css.indexOf("@media (max-width: 639px)"), css.indexOf("@layer base"));
  assert.match(mobile, /\.mobile-compact-dialog\s*\{/);
  assert.match(mobile, /max-width:\s*min\(360px, calc\(100vw - 48px\)\)/);
  assert.match(mobile, /\.mobile-compact-dialog-actions > button\s*\{\s*min-height:\s*48px/);
  assert.doesNotMatch(css.replace(mobile, ""), /\.mobile-compact-dialog/);
});
