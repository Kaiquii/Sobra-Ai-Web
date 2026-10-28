"use client";

import { Fragment, memo, useMemo, type ReactNode } from "react";
import type { AssistantMessage } from "../types/assistant";
import { formatAssistantMessage, type MessageLine } from "../utils/assistantMessageFormatting";

function inlineText(line: MessageLine) {
  return line.runs.map((run, index) =>
    run.bold ? (
      <strong key={index}>{run.text}</strong>
    ) : (
      <Fragment key={index}>{run.text}</Fragment>
    ),
  );
}

function formattedLines(lines: MessageLine[]) {
  const children: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    if (index > 0) children.push("\n");
    const start = index;
    if (!lines[index].listItem) {
      children.push(<Fragment key={index}>{inlineText(lines[index])}</Fragment>);
      index++;
      continue;
    }
    const items: ReactNode[] = [];
    while (index < lines.length && lines[index].listItem) {
      if (index > start) items.push("\n");
      // Markers stay in text nodes: copy and reading order do not depend on CSS counters.
      items.push(
        <span
          key={index}
          role="listitem"
          className="inline-block max-w-full align-top pl-6 -indent-6"
        >
          {inlineText(lines[index])}
        </span>,
      );
      index++;
    }
    children.push(
      <span key={start} role="list">
        {items}
      </span>,
    );
  }
  return children;
}

export const AssistantMessageContent = memo(function AssistantMessageContent({
  message,
}: {
  message: Pick<AssistantMessage, "content" | "role" | "error_code" | "code">;
}) {
  const { content, role, error_code, code } = message;
  const formatted = useMemo(
    () => formatAssistantMessage({ content, role, error_code, code }),
    [content, role, error_code, code],
  );
  return (
    <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
      {formatted.kind === "literal" ? formatted.text : formattedLines(formatted.lines)}
    </span>
  );
});
