"use client";

import { createContext, useContext, useEffect } from "react";

/**
 * App is dark-only. Provider preserves the API surface (in case any UI still
 * reads `useTheme()`), but always resolves to dark and ignores user toggles.
 */

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark" as Theme,
      resolvedTheme: "dark" as Resolved,
      setTheme: () => {},
    };
  }
  return ctx;
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}) {
  // Force dark class on html on mount.
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "dark",
        resolvedTheme: "dark",
        setTheme: () => {
          /* noop — app is dark-only */
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
