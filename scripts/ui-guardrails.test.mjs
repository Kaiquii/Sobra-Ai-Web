import assert from "node:assert/strict";
import test from "node:test";
import { hasThemeColorTransition } from "./ui-guardrails.mjs";

test("theme guard rejects color/all transitions including responsive and dark variants", () => {
  for (const source of [
    'className="transition-colors duration-150"',
    'className="dark:transition-colors"',
    'className="sm:transition-all"',
    'className="transition"',
    '"rotate-180 transition"',
    "transition: background-color 150ms;",
    "transition: 0.2s;",
    "transition-property: color;",
  ])
    assert.equal(hasThemeColorTransition(source), true, source);
});

test("theme guard permits transform-only motion, loading indicators and unrelated identifiers", () => {
  for (const source of [
    'className="transition-transform duration-150"',
    'className="animate-spin"',
    'className="animate-pulse"',
    "const [pending, startTransition] = useTransition();",
    "transition: transform 150ms;",
  ])
    assert.equal(hasThemeColorTransition(source), false, source);
});
