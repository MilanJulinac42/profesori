"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type PaletteCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const Ctx = createContext<PaletteCtx | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Cmd/Ctrl+K — global search palette. Works even when focused in inputs
  // (it's a universal search shortcut). Esc closes.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isModK =
        (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (!isModK) return;
      e.preventDefault();
      setOpen((v) => !v);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Ctx.Provider value={{ open, setOpen, toggle }}>{children}</Ctx.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("usePalette must be used within <PaletteProvider>");
  }
  return ctx;
}
