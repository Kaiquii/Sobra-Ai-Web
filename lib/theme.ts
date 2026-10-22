export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "app-financeiro-theme";
export const THEME_COLORS = { light: "#f8fafc", dark: "#020617" } as const;

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) ?? "null");
    if (stored?.state?.theme === "light" || stored?.state?.theme === "dark") return stored.state.theme;
  } catch { }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyBrowserTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const color = THEME_COLORS[theme];
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.backgroundColor = color;
  document.documentElement.style.colorScheme = theme;
  for (const [name, content] of [["theme-color", color], ["color-scheme", theme]]) {
    document.querySelectorAll(`meta[name="${name}"]`).forEach((meta) => {
      // Avoid a MutationObserver loop and let the app's chosen theme override OS media queries.
      if (meta.getAttribute("content") !== content) meta.setAttribute("content", content);
      if (meta.hasAttribute("media")) meta.removeAttribute("media");
    });
  }
}

// Runs before hydration; uses the same storage key, fallback and colors as the store.
export const THEME_BOOTSTRAP_SCRIPT = `
  (function () {
    var theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    try {
      var stored = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || "null");
      if (stored && stored.state && (stored.state.theme === "dark" || stored.state.theme === "light")) theme = stored.state.theme;
    } catch (error) {}
    var color = ${JSON.stringify(THEME_COLORS)}[theme];
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.backgroundColor = color;
    document.documentElement.style.colorScheme = theme;
    ["theme-color", "color-scheme"].forEach(function (name) {
      document.querySelectorAll('meta[name="' + name + '"]').forEach(function (meta) {
        meta.setAttribute("content", name === "theme-color" ? color : theme);
        meta.removeAttribute("media");
      });
    });
  })();
`;
