import { isAssistantErrorCode } from "../api/assistantErrors";
import type { AssistantMessage } from "../types/assistant";

export type MessageRun = { text: string; bold: boolean };
export type MessageLine = { runs: MessageRun[]; listItem: boolean };
export type FormattedAssistantMessage =
  | { kind: "literal"; text: string }
  | { kind: "formatted"; lines: MessageLine[] };

const whitespace = /\s/u;
const letterOrDigit = /[\p{L}\p{Nd}]/u;

function previousCharacter(text: string, index: number) {
  const last = text.charCodeAt(index - 1);
  return last >= 0xdc00 && last <= 0xdfff && index > 1
    ? text.slice(index - 2, index)
    : text[index - 1];
}

// Every character is visited once. Delimiters pair only within this line;
// unsupported/escaped markers are copied, not stripped from the message.
function boldRuns(line: string): MessageRun[] {
  const ranges: { opening: number; closing: number }[] = [];
  let opening = -1,
    index = 0,
    backslashes = 0;
  while (index < line.length) {
    if (line[index] === "\\") {
      backslashes++;
      index++;
      continue;
    }
    if (line[index] !== "*") {
      backslashes = 0;
      index++;
      continue;
    }
    const start = index;
    while (index < line.length && line[index] === "*") index++;
    const length = index - start;
    const escaped = backslashes % 2 !== 0;
    backslashes = 0;
    if (length > 2) {
      opening = -1;
      continue;
    }
    if (length !== 2 || escaped) continue;
    const before = previousCharacter(line, start);
    const point = line.codePointAt(index);
    const after = point === undefined ? undefined : String.fromCodePoint(point);
    const canOpen =
      after !== undefined &&
      !whitespace.test(after) &&
      (before === undefined || !letterOrDigit.test(before));
    const canClose =
      before !== undefined &&
      !whitespace.test(before) &&
      (after === undefined || !letterOrDigit.test(after));
    if (opening >= 0 && canClose && start > opening + 2) {
      ranges.push({ opening, closing: start });
      opening = -1;
    } else if (canOpen) opening = start;
  }
  const runs: MessageRun[] = [];
  let copiedUntil = 0;
  for (const range of ranges) {
    if (range.opening > copiedUntil)
      runs.push({ text: line.slice(copiedUntil, range.opening), bold: false });
    runs.push({ text: line.slice(range.opening + 2, range.closing), bold: true });
    copiedUntil = range.closing + 2;
  }
  if (copiedUntil < line.length || runs.length === 0)
    runs.push({ text: line.slice(copiedUntil), bold: false });
  return runs;
}

function isSimpleListItem(line: string) {
  let start = 0;
  while (start < line.length && whitespace.test(line[start])) start++;
  if (start === line.length) return false;
  let end = start;
  if (line[start] === "-" || line[start] === "*") end++;
  else {
    while (end < line.length && line[end] >= "0" && line[end] <= "9") end++;
    if (end === start || (line[end] !== "." && line[end] !== ")")) return false;
    end++;
  }
  if (end >= line.length || !whitespace.test(line[end])) return false;
  let body = line.slice(end).trimStart();
  if (body.startsWith("**")) body = body.slice(2);
  if (!body.trim()) return false;
  // A minus before an amount is part of that amount. Keep all list markers too.
  if (
    line[start] === "-" &&
    ((body[0] >= "0" && body[0] <= "9") || body.slice(0, 2).toUpperCase() === "R$")
  )
    return false;
  return true;
}

export function formatAssistantMessage(
  message: Pick<AssistantMessage, "content" | "role" | "error_code" | "code">,
): FormattedAssistantMessage {
  if (
    message.role !== "assistant" ||
    isAssistantErrorCode(message.error_code) ||
    isAssistantErrorCode(message.code)
  )
    return { kind: "literal", text: message.content };
  return {
    kind: "formatted",
    lines: message.content
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => ({ runs: boldRuns(line), listItem: isSimpleListItem(line) })),
  };
}
