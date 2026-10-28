import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modules = new Map();
function loadTs(relativePath) {
  const base = path.resolve(root, relativePath);
  const filename = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => existsSync(candidate));
  if (!filename) throw new Error(`Test source not found: ${relativePath}`);
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (name.startsWith("@/")) return loadTs(name.slice(2));
      if (name.startsWith(".")) return loadTs(path.resolve(path.dirname(filename), name));
      return require(name);
    },
  }, { filename });
  return exports;
}

const { formatAssistantMessage } = loadTs("features/assistant/utils/assistantMessageFormatting.ts");
const { AssistantMessageContent } = loadTs("features/assistant/components/AssistantMessageContent.tsx");
const assistant = (content, extra = {}) => ({ role: "assistant", content, ...extra });
function visible(result) {
  return result.kind === "literal"
    ? result.text
    : result.lines.map((line) => line.runs.map((run) => run.text).join("")).join("\n");
}
function bold(result) {
  return result.kind === "literal" ? []
    : result.lines.flatMap((line) => line.runs.filter((run) => run.bold).map((run) => run.text));
}
const markup = (message) => renderToStaticMarkup(createElement(AssistantMessageContent, { message }));
function renderedText(html) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#39": "'" };
  return html.replace(/<[^>]*>/g, "").replace(/&(amp|lt|gt|quot|#x27|#39);/g, (_, entity) => entities[entity]);
}

test("assistant emphasis produces semantic bold spans without changing the source message", () => {
  const content = "Seu **saldo disponível** é **R$ 1.234,56**.";
  const message = Object.freeze(assistant(content));
  const result = formatAssistantMessage(message);
  assert.equal(visible(result), "Seu saldo disponível é R$ 1.234,56.");
  assert.deepEqual(Array.from(bold(result)), ["saldo disponível", "R$ 1.234,56"]);
  const html = markup(message);
  assert.equal((html.match(/<strong(?:\s|>)/g) ?? []).length, 2);
  assert.equal(renderedText(html), visible(result));
  assert.equal(message.content, content);
});

test("unmatched markers, isolated stars, unsupported runs and intraword markers stay literal", () => {
  for (const content of [
    "**Sem fechamento", "Sem abertura**", "2 * 3 = 6", "Asterisco * literal",
    "****", "***Não suportado***", "** espaço **", "**espaço **", "** espaço**",
    "pré**nome**", "**nome**sufixo", "**primeiro **** sem fechar**", "**ab***cd**",
  ]) {
    const result = formatAssistantMessage(assistant(content));
    assert.equal(visible(result), content, content);
    assert.equal(bold(result).length, 0, content);
    assert.equal(renderedText(markup(assistant(content))), content, content);
  }
});

test("escaping respects odd and even backslashes without deleting the escape characters", () => {
  for (const content of [String.raw`\**marcador literal**`, String.raw`\\\**também literal**`]) {
    const result = formatAssistantMessage(assistant(content));
    assert.equal(visible(result), content);
    assert.equal(bold(result).length, 0);
  }
  const even = formatAssistantMessage(assistant(String.raw`\\**válido**`));
  assert.equal(visible(even), String.raw`\\válido`);
  assert.deepEqual(Array.from(bold(even)), ["válido"]);
  const inner = formatAssistantMessage(assistant(String.raw`**A \** B**`));
  assert.equal(visible(inner), String.raw`A \** B`);
  assert.deepEqual(Array.from(bold(inner)), [String.raw`A \** B`]);
});

test("bold pairs never consume across a line boundary or hide unsupported Markdown syntax", () => {
  for (const content of ["**abre\nfecha**", "**abre\n\nfecha**", "# Título\n_texto_\n`código`\n~~riscado~~"]) {
    const result = formatAssistantMessage(assistant(content));
    assert.equal(visible(result), content);
    assert.equal(bold(result).length, 0);
  }
});

test("Portuguese, combining characters and Unicode emojis retain their order and values", () => {
  const content = "💡 **Atenção às parcelas**: você tem **R$ -25,40** em ajustes. ✅ 👩🏽‍💻 **ação e café**";
  const result = formatAssistantMessage(assistant(content));
  assert.equal(visible(result), "💡 Atenção às parcelas: você tem R$ -25,40 em ajustes. ✅ 👩🏽‍💻 ação e café");
  assert.deepEqual(Array.from(bold(result)), ["Atenção às parcelas", "R$ -25,40", "ação e café"]);
  assert.equal(renderedText(markup(assistant(content))), visible(result));
});

test("paragraphs and line endings normalize only in presentation while empty lines remain", () => {
  const content = "**Resumo**\r\n\r\nReceitas recebidas.\rConfira as despesas.\n\nPosso ajudar.\n";
  const message = Object.freeze(assistant(content));
  const expected = "Resumo\n\nReceitas recebidas.\nConfira as despesas.\n\nPosso ajudar.\n";
  assert.equal(visible(formatAssistantMessage(message)), expected);
  assert.equal(renderedText(markup(message)), expected);
  assert.equal(message.content, content);
});

test("numbered advice preserves explicit numbering, ordering and list item semantics", () => {
  const items = ["Usar transporte público", "Caminhar", "Compartilhar viagens", "Evitar horários de pico", "Planejar o trajeto", "Combinar compromissos"];
  const lines = items.map((item, index) => `${index + 1}${index % 2 ? ")" : "."} **${item}**: considere sua rotina.`);
  const content = `Algumas opções:\n\n${lines.join("\n")}\n\nVocê decide.`;
  const result = formatAssistantMessage(assistant(content));
  const expected = `Algumas opções:\n\n${items.map((item, index) => `${index + 1}${index % 2 ? ")" : "."} ${item}: considere sua rotina.`).join("\n")}\n\nVocê decide.`;
  assert.equal(visible(result), expected);
  assert.deepEqual(Array.from(bold(result)), items);
  assert.equal(result.lines.filter((line) => line.listItem).length, 6);
  const html = markup(assistant(content));
  assert.equal((html.match(/role="listitem"/g) ?? []).length, 6);
  assert.ok(html.includes('role="list"'));
  assert.equal(renderedText(html), expected);
});

test("simple bullet markers and leading whitespace remain actual selectable text", () => {
  const content = "- **Guardar recibos** para consultar depois.\n* **Conferir parcelas** antes de outra compra.\n  - **Planejar** com calma.";
  const expected = "- Guardar recibos para consultar depois.\n* Conferir parcelas antes de outra compra.\n  - Planejar com calma.";
  const message = assistant(content);
  const result = formatAssistantMessage(message);
  assert.equal(visible(result), expected);
  assert.equal(result.lines.filter((line) => line.listItem).length, 3);
  const html = markup(message);
  assert.equal((html.match(/role="listitem"/g) ?? []).length, 3);
  assert.equal(renderedText(html), expected);
});

test("negative amounts, signs, years and IDs cannot become hidden markers or recalculated money", () => {
  const content = "Saldo de 2026, registro 154:\n\n- R$ 1.234,56\n- 25,40\n-1.234,56\n-R$ 20,00\n- **R$ 42,50**\n**- R$ 42,50**\n−R$ 15,00\n+R$ 3,10\n2026. manter o ano\n1.234,56";
  const expected = content.replace("- **R$ 42,50**", "- R$ 42,50").replace("**- R$ 42,50**", "- R$ 42,50");
  const message = Object.freeze(assistant(content));
  const result = formatAssistantMessage(message);
  assert.equal(visible(result), expected);
  for (const index of [2, 3, 4, 5, 6, 7, 8, 9, 11]) assert.equal(result.lines[index].listItem, false, result.lines[index].runs.map((run) => run.text).join(""));
  assert.equal(result.lines[10].listItem, true);
  assert.equal(renderedText(markup(message)), expected);
  assert.equal(message.content, content);
});

test("only real simple-list markers introduce list semantics", () => {
  const content = "-\n*\n-   \n1.\n2)\n3)   \n\\- item literal\n1.234,56\n**negrito sem lista**\n-\titem\n10) item";
  const result = formatAssistantMessage(assistant(content));
  assert.equal(result.lines.filter((line) => line.listItem).length, 2);
  assert.equal(result.lines[9].listItem, true);
  assert.equal(result.lines[10].listItem, true);
});

test("user, system and recognized assistant warnings remain entirely literal through both code aliases", () => {
  const content = "**Texto digitado**\r\n- item\r1. mensagem 💡";
  const messages = [assistant(content, { role: "user" }), assistant(content, { role: "system" }), assistant(content, { role: "Assistant" })];
  for (const code of ["assistant_quota_exceeded", "assistant_user_limit", "assistant_unavailable", "assistant_other", "gemini_quota_exceeded"]) {
    messages.push(assistant(content, { error_code: code }), assistant(content, { code }));
  }
  messages.push(
    assistant(content, { error_code: "unrelated_code", code: "assistant_unavailable" }),
    assistant(content, { error_code: "assistant_user_limit", code: "unrelated_code" }),
  );
  for (const message of messages) {
    const result = formatAssistantMessage(Object.freeze(message));
    assert.equal(result.kind, "literal");
    assert.equal(result.text, content);
    const html = markup(message);
    assert.equal((html.match(/<strong(?:\s|>)/g) ?? []).length, 0);
    assert.equal((html.match(/role="listitem"/g) ?? []).length, 0);
    assert.equal(renderedText(html), content);
    assert.equal(message.content, content);
  }
  assert.equal(formatAssistantMessage(assistant("**Normal**", { code: "unrelated_code" })).kind, "formatted");
});

test("HTML, Markdown images, URLs and javascript strings are inert escaped text", () => {
  const content = '<b>Texto</b> <img src="https://example.invalid/a.png" onerror="alert(1)"> <script>alert(1)</script> <svg onload="alert(2)"></svg>\n[Abrir site](https://example.invalid/) ![foto](https://example.invalid/a.png) javascript:alert(1)\n**Seguro** & "aspas"';
  const message = assistant(content);
  const result = formatAssistantMessage(message);
  const expected = content.replace("**Seguro**", "Seguro");
  const html = markup(message);
  assert.equal(visible(result), expected);
  assert.equal(renderedText(html), expected);
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.equal(/<(?:a|img|script|svg|iframe|object|video)\b/i.test(html), false);
  assert.equal((html.match(/<strong(?:\s|>)/g) ?? []).length, 1);
});

test("fresh replies and stored history share one renderer without mutating source strings", () => {
  const content = "**Resumo**\n\nSeu saldo é R$ 25,00. 💡\n1. Confira os recibos.";
  const fresh = Object.freeze(assistant(content));
  const stored = Object.freeze({ id: 42, message_id: 42, conversation_id: 7, role: "assistant", content, display_time: "Agora" });
  assert.equal(JSON.stringify(formatAssistantMessage(fresh)), JSON.stringify(formatAssistantMessage(stored)));
  assert.equal(markup(fresh), markup(stored));
  assert.equal(fresh.content, content);
  assert.equal(stored.content, content);
});

test("empty assistant content stays empty", () => {
  assert.equal(visible(formatAssistantMessage(assistant(""))), "");
  assert.equal(renderedText(markup(assistant(""))), "");
});

test("long adversarial runs and escaped delimiters complete without dropping literal data", { timeout: 15000 }, () => {
  for (const content of ["*".repeat(200000) + " fim", String.raw`\**texto `.repeat(25000) + "💡", "**" + "a ".repeat(60000) + "***fim**"]) {
    const result = formatAssistantMessage(assistant(content));
    assert.equal(visible(result), content);
    assert.equal(bold(result).length, 0);
  }
  const lines = Array.from({ length: 10000 }, (_, index) => `${index + 1}. **Registro ${index}**: R$ -25,40.`).join("\n");
  const result = formatAssistantMessage(assistant(lines));
  assert.equal(result.lines.length, 10000);
  assert.equal(result.lines.filter((line) => line.listItem).length, 10000);
  assert.equal(bold(result).length, 10000);
  assert.ok(visible(result).endsWith("10000. Registro 9999: R$ -25,40."));
});
