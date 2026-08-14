"use client";

import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "route53-clone-theme";

interface ThemeContextValue {
  mode: Mode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredMode(): Mode {
  if (typeof window === "undefined") return Mode.Light;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === Mode.Dark ? Mode.Dark : Mode.Light;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(Mode.Light);

  useEffect(() => {
    const initial = readStoredMode();
    setMode(initial);
    applyMode(initial);
  }, []);

  const toggleMode = () => {
    setMode((current) => {
      const next = current === Mode.Dark ? Mode.Light : Mode.Dark;
      applyMode(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
