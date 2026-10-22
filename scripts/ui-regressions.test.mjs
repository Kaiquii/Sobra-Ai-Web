import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { applyBrowserTheme, getInitialTheme, THEME_BOOTSTRAP_SCRIPT } from "../lib/theme.ts";
import { getMonthlyLoadFeedback } from "../features/summary/utils/monthlyLoadState.ts";

function browser({ savedTheme, darkSystem = true, storageFails = false } = {}) {
  let writes = 0;
  function meta(content, media) {
    const attributes = new Map([["content", content], ...(media ? [["media", media]] : [])]);
    return {
      getAttribute: (name) => attributes.get(name) ?? null,
      hasAttribute: (name) => attributes.has(name),
      setAttribute: (name, value) => { writes++; attributes.set(name, value); },
      removeAttribute: (name) => { writes++; attributes.delete(name); },
    };
  }
  const metas = {
    "theme-color": [meta("#f8fafc", "(prefers-color-scheme: light)"), meta("#020617", "(prefers-color-scheme: dark)")],
    "color-scheme": [meta("light dark")],
  };
  const classes = new Set();
  const document = {
    documentElement: {
      style: {},
      classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } },
    },
    querySelectorAll: (selector) => metas[selector.match(/name="([^"]+)"/)[1]] ?? [],
  };
  const localStorage = { getItem: () => {
    if (storageFails) throw Error("Storage blocked");
    return savedTheme ? JSON.stringify({ state: { theme: savedTheme } }) : null;
  } };
  return { document, localStorage, window: { localStorage, matchMedia: () => ({ matches: darkSystem }) }, metas, classes, get writes() { return writes; } };
}

function withBrowser(state, action) {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  globalThis.document = state.document;
  globalThis.window = state.window;
  try { action(); } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
}

test("the first paint follows a dark phone when storage is unavailable", () => {
  const state = browser({ storageFails: true });
  vm.runInNewContext(THEME_BOOTSTRAP_SCRIPT, state);
  withBrowser(state, () => assert.equal(getInitialTheme(), "dark"));
  assert.ok(state.classes.has("dark"));
  assert.equal(state.document.documentElement.style.colorScheme, "dark");
  assert.ok(state.metas["theme-color"].every((meta) => meta.getAttribute("content") === "#020617"));
});

test("an explicit light preference still overrides a dark system", () => {
  const state = browser({ savedTheme: "light" });
  vm.runInNewContext(THEME_BOOTSTRAP_SCRIPT, state);
  withBrowser(state, () => assert.equal(getInitialTheme(), "light"));
  assert.equal(state.classes.has("dark"), false);
  assert.equal(state.document.documentElement.style.colorScheme, "light");
});

test("restores all theme metadata after navigation inserts light values, without a mutation loop", () => {
  const state = browser();
  withBrowser(state, () => {
    applyBrowserTheme("dark");
    state.metas["theme-color"][0].setAttribute("content", "#f8fafc");
    state.metas["color-scheme"][0].setAttribute("content", "light dark");
    applyBrowserTheme("dark");
    assert.ok(state.metas["theme-color"].every((meta) => meta.getAttribute("content") === "#020617" && !meta.hasAttribute("media")));
    assert.equal(state.metas["color-scheme"][0].getAttribute("content"), "dark");
    const writesBefore = state.writes;
    applyBrowserTheme("dark");
    assert.equal(state.writes, writesBefore);
  });
});

test("switching month is loading immediately, even before the request effect runs", () => {
  const october = { requestKey: "2026-10-0", status: "success", error: null };
  assert.deepEqual(getMonthlyLoadFeedback(october, "2026-11-0"), { isLoading: true, error: null });
});

test("an old month failure cannot flash an error in a newly selected month", () => {
  const failedOctober = { requestKey: "2026-10-0", status: "error", error: "Request failed" };
  assert.deepEqual(getMonthlyLoadFeedback(failedOctober, "2026-11-0"), { isLoading: true, error: null });
  assert.deepEqual(getMonthlyLoadFeedback(failedOctober, "2026-10-0"), { isLoading: false, error: "Request failed" });
});

test("refreshing after a save starts a new request without treating missing feedback as failure", () => {
  const savedPeriod = { requestKey: "2026-10-0", status: "success", error: null };
  assert.deepEqual(getMonthlyLoadFeedback(savedPeriod, "2026-10-1"), { isLoading: true, error: null });
  assert.deepEqual(getMonthlyLoadFeedback({ ...savedPeriod, requestKey: "2026-10-1" }, "2026-10-1"), { isLoading: false, error: null });
});
