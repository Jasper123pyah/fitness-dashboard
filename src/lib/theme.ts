import type { Theme } from "@/db/types";

export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "trainlog.theme";

export function prefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(theme: Theme, systemDark: boolean): ResolvedTheme {
  if (theme === "SYSTEM") return systemDark ? "dark" : "light";
  return theme === "DARK" ? "dark" : "light";
}

/** Het thema staat ook in localStorage, zodat er bij het opstarten geen flits is. */
export function readStoredTheme(): Theme {
  if (typeof localStorage === "undefined") return "SYSTEM";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "LIGHT" || stored === "DARK" || stored === "SYSTEM"
    ? stored
    : "SYSTEM";
}

export function storeTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/** Zet het thema op het document. Wordt ook vóór de eerste render aangeroepen. */
export function applyResolvedTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? "#111317" : "#ffffff");
}

export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolveTheme(theme, prefersDark());
  applyResolvedTheme(resolved);
  return resolved;
}
