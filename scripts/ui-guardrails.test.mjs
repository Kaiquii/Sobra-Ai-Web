import assert from "node:assert/strict";
import test from "node:test";
import { hasCustomFontLoading, hasThemeColorTransition } from "./ui-guardrails.mjs";

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

test("typography guard rejects bundled and remote font loaders", () => {
  for (const source of [
    '@font-face { font-family: "Custom"; }',
    'import localFont from "next/font/local";',
    'import { Roboto } from "next/font/google";',
    'import "@fontsource/roboto/400.css";',
    'import "@fontsource-variable/roboto";',
    '@import url("https://fonts.googleapis.com/css2?family=Roboto");',
  ])
    assert.equal(hasCustomFontLoading(source), true, source);
});

test("typography guard preserves the Web system font and inherited typography", () => {
  for (const source of [
    'font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;',
    'font-family: inherit;',
    'className="text-sm font-semibold"',
  ])
    assert.equal(hasCustomFontLoading(source), false, source);
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
