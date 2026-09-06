import { create } from "zustand";

type Theme = "light" | "dark";
const STORAGE_KEY = "ucn-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(STORAGE_KEY, theme);
}

interface UiState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
}));

// Apply on module load so the correct class is present before first paint
// (avoids a light->dark flash for users with a stored/OS dark preference).
if (typeof document !== "undefined") {
  applyTheme(useUiStore.getState().theme);
}
