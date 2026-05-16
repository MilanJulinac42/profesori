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
  messages: UIMessage[];
  setMessages: Dispatch<SetStateAction<UIMessage[]>>;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  bubble: AssistantBubble | null;
  setBubble: (b: AssistantBubble | null) => void;
  clearConversation: () => void;
};

const Ctx = createContext<AssistantCtx | null>(null);

const STORAGE_KEY = "profesori_assistant_v1";
const MAX_PERSISTED_MESSAGES = 50;

type PersistShape = {
  messages: UIMessage[];
  conversationId: string | null;
};

function loadPersisted(): PersistShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [bubble, setBubble] = useState<AssistantBubble | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore prior conversation from localStorage on first mount.
  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      setMessages(persisted.messages);
      setConversationId(persisted.conversationId);
    }
    setHydrated(true);
  }, []);

  // Persist conversation. Only after hydration so we don't wipe storage with
  // the initial empty state.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: trimmed, conversationId }),
      );
    } catch {
      // Quota exceeded or storage disabled — silently ignore.
    }
  }, [hydrated, messages, conversationId]);

  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    if (v) setBubble(null);
  }, []);

  const toggle = useCallback(() => {
    setOpenState((v) => !v);
    setBubble(null);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
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
        conversationId,
        setConversationId,
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
  // Strip query string and trailing slash.
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

  // Dynamic patterns.
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
