"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  readonly theme: ThemeMode;
  readonly effectiveTheme: ThemeMode;
  readonly isPrintMode: boolean;
  readonly toggleTheme: () => void;
  readonly enterPrintMode: () => Promise<void>;
  readonly exitPrintMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "documark_theme";

export function ThemeProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const effectiveTheme: ThemeMode = isPrintMode ? "light" : theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const enterPrintMode = useCallback(async (): Promise<void> => {
    setIsPrintMode(true);
    document.documentElement.setAttribute("data-theme", "light");
    // Allow Mermaid SVGs and Shiki blocks to finish re-rendering in high-contrast light mode before print capture.
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 350);
    });
  }, []);

  const exitPrintMode = useCallback((): void => {
    setIsPrintMode(false);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      effectiveTheme,
      isPrintMode,
      toggleTheme,
      enterPrintMode,
      exitPrintMode,
    }),
    [
      theme,
      effectiveTheme,
      isPrintMode,
      toggleTheme,
      enterPrintMode,
      exitPrintMode,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }
  return context;
}

