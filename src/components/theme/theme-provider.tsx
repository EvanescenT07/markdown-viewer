"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";

export type ThemeMode = "light" | "dark";

export interface ThemeRevealOrigin {
  readonly x: number;
  readonly y: number;
}

type ThemeToggleTrigger =
  | React.MouseEvent<HTMLElement>
  | ThemeRevealOrigin
  | undefined;

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    readonly ready: Promise<void>;
    readonly finished: Promise<void>;
  };
};

interface FallbackClipState {
  readonly x: number;
  readonly y: number;
  readonly maxRadius: number;
  readonly targetTheme: ThemeMode;
}

interface ThemeContextValue {
  readonly theme: ThemeMode;
  readonly effectiveTheme: ThemeMode;
  readonly isPrintMode: boolean;
  readonly toggleTheme: (trigger?: ThemeToggleTrigger) => void;
  readonly enterPrintMode: () => Promise<void>;
  readonly exitPrintMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "documark_theme";

function resolveRevealOrigin(trigger?: ThemeToggleTrigger): ThemeRevealOrigin {
  if (trigger && "currentTarget" in trigger && trigger.currentTarget) {
    const iconElement =
      trigger.currentTarget.querySelector<HTMLElement>("[data-theme-icon]") ??
      trigger.currentTarget;
    const rect = iconElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    if (trigger.clientX > 0 || trigger.clientY > 0) {
      return { x: trigger.clientX, y: trigger.clientY };
    }
  }

  if (trigger && "x" in trigger && "y" in trigger) {
    return { x: trigger.x, y: trigger.y };
  }

  if (typeof window !== "undefined") {
    return { x: window.innerWidth - 48, y: 28 };
  }

  return { x: 0, y: 0 };
}

export function ThemeProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [fallbackClip, setFallbackClip] = useState<FallbackClipState | null>(
    null
  );

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

  const applyThemeDom = useCallback((nextTheme: ThemeMode): void => {
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }, []);

  const toggleTheme = useCallback(
    (trigger?: ThemeToggleTrigger) => {
      const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";

      if (typeof window === "undefined") {
        setTheme(nextTheme);
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        applyThemeDom(nextTheme);
        return;
      }

      const { x, y } = resolveRevealOrigin(trigger);
      const maxHorizontal = Math.max(x, window.innerWidth - x);
      const maxVertical = Math.max(y, window.innerHeight - y);
      const maxRadius = Math.hypot(maxHorizontal, maxVertical);

      const docWithTransition = document as ViewTransitionDocument;

      if (typeof docWithTransition.startViewTransition === "function") {
        const transition = docWithTransition.startViewTransition(() => {
          flushSync(() => {
            applyThemeDom(nextTheme);
          });
        });

        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${maxRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 550,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          })
          .catch(() => {
            applyThemeDom(nextTheme);
          });
        return;
      }

      setFallbackClip({
        x,
        y,
        maxRadius,
        targetTheme: nextTheme,
      });

      window.setTimeout(() => {
        applyThemeDom(nextTheme);
      }, 240);

      window.setTimeout(() => {
        setFallbackClip(null);
      }, 560);
    },
    [applyThemeDom, theme]
  );

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
    <ThemeContext.Provider value={value}>
      {children}
      {fallbackClip && (
        <div
          aria-hidden="true"
          style={{
            backgroundColor:
              fallbackClip.targetTheme === "dark" ? "#121316" : "#FAF9F6",
            clipPath: `circle(${fallbackClip.maxRadius}px at ${fallbackClip.x}px ${fallbackClip.y}px)`,
            animation:
              "documark-circular-fallback 550ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
            ["--reveal-x" as string]: `${fallbackClip.x}px`,
            ["--reveal-y" as string]: `${fallbackClip.y}px`,
            ["--reveal-r" as string]: `${fallbackClip.maxRadius}px`,
          }}
          className="pointer-events-none fixed inset-0 z-[9999] print:hidden"
        />
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }
  return context;
}
