"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { HistoryMessage } from "@/lib/assistant/chat";
import type { UIMessage } from "./types";

export type AssistantBubble = {
  /** Short text shown above the floating button after a redirect. */
  text: string;
  /** Path the assistant navigated to (informational; not required for render). */
  path: string;
  /** Timestamp so React treats consecutive identical messages as new. */
  shownAt: number;
};

type AssistantCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  /** UI-facing message list for rendering the chat. */
  messages: UIMessage[];
  setMessages: Dispatch<SetStateAction<UIMessage[]>>;
  /** Raw Anthropic-format history sent back to the server on each turn. */
  history: HistoryMessage[];
  setHistory: Dispatch<SetStateAction<HistoryMessage[]>>;
  bubble: AssistantBubble | null;
  setBubble: (b: AssistantBubble | null) => void;
  clearConversation: () => void;
};

const Ctx = createContext<AssistantCtx | null>(null);

const STORAGE_KEY = "profesori_assistant_v2";
// Cap to keep localStorage payload small. Older turns are dropped first.
const MAX_PERSISTED_MESSAGES = 50;
const MAX_PERSISTED_HISTORY = 60;
// Floating post-redirect bubble auto-dismisses after this many ms so it
// doesn't sit on top of the new page indefinitely.
const BUBBLE_AUTO_DISMISS_MS = 25_000;

type PersistShape = {
  messages: UIMessage[];
  history: HistoryMessage[];
};

function loadPersisted(): PersistShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(parsed.messages) || !Array.isArray(parsed.history)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [bubble, setBubble] = useState<AssistantBubble | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore prior conversation from localStorage on first mount.
  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      setMessages(persisted.messages);
      setHistory(persisted.history);
    }
    setHydrated(true);
  }, []);

  // Persist after hydration so we don't wipe storage with the empty initial.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      const trimmedMessages = messages.slice(-MAX_PERSISTED_MESSAGES);
      const trimmedHistory = history.slice(-MAX_PERSISTED_HISTORY);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          messages: trimmedMessages,
          history: trimmedHistory,
        }),
      );
    } catch {
      // Quota exceeded or storage disabled — silently ignore.
    }
  }, [hydrated, messages, history]);

  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    if (v) setBubble(null);
  }, []);

  const toggle = useCallback(() => {
    setOpenState((v) => !v);
    setBubble(null);
  }, []);

  // Bubble auto-dismiss: clear after BUBBLE_AUTO_DISMISS_MS unless user
  // already interacted (clicked it open or x'd it).
  useEffect(() => {
    if (!bubble) return;
    const id = window.setTimeout(
      () => setBubble(null),
      BUBBLE_AUTO_DISMISS_MS,
    );
    return () => window.clearTimeout(id);
  }, [bubble]);

  // Cmd/Ctrl+K toggles the assistant globally. Ignored while user is typing
  // in form fields so we don't steal text-shortcut combos.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isModK =
        (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (!isModK) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      setOpenState((v) => !v);
      setBubble(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setHistory([]);
    setBubble(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <Ctx.Provider
      value={{
        open,
        setOpen,
        toggle,
        messages,
        setMessages,
        history,
        setHistory,
        bubble,
        setBubble,
        clearConversation,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useAssistant must be used within <AssistantProvider>");
  }
  return ctx;
}

/**
 * Maps a route to a short human-friendly label for the post-redirect bubble.
 * Falls back to a generic "stranicu" prefix for unknown paths.
 */
export function labelForPath(path: string): string {
  const clean = path.split("?")[0].replace(/\/$/, "");

  const exact: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/students": "Učenici",
    "/students/new": "Novi učenik",
    "/schedule": "Raspored",
    "/billing": "Naplata",
    "/poruke": "Poruke",
    "/poruke/parser": "Parser poruka",
    "/profile": "Javni profil",
    "/profile/inbox": "Upiti",
    "/settings": "Podešavanja",
    "/exercises": "Zadaci",
    "/exercises/new": "Novi zadatak",
    "/asistent": "AI Asistent",
  };
  if (clean in exact) return exact[clean];

  if (/^\/students\/[^/]+\/edit$/.test(clean)) return "Izmenu učenika";
  if (/^\/students\/[^/]+\/bill$/.test(clean)) return "Mesečni račun učenika";
  if (/^\/students\/[^/]+\/yearbook$/.test(clean)) return "Godišnjak učenika";
  if (/^\/students\/[^/]+$/.test(clean)) return "Stranicu učenika";
  if (/^\/lessons\/[^/]+\/note$/.test(clean)) return "Belešku časa";
  if (/^\/exercises\/[^/]+\/print$/.test(clean)) return "Štampu zadatka";
  if (/^\/exercises\/[^/]+$/.test(clean)) return "Zadatak";
  if (/^\/reports\/[^/]+\/print$/.test(clean)) return "Štampu izveštaja";
  if (/^\/reports\/[^/]+$/.test(clean)) return "Izveštaj";

  return "novu stranicu";
}
