"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { HistoryMessage } from "@/lib/assistant/chat";
import {
  getAssistantSuggestions,
  type AssistantSuggestion,
} from "@/lib/assistant/suggestions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProposalCard } from "./proposal-card";
import { useAssistant, labelForPath } from "./assistant-context";
import type { Proposal, UIMessage } from "./types";

const BUBBLE_MAX_LEN = 140;

function truncateForBubble(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= BUBBLE_MAX_LEN) return trimmed;
  return trimmed.slice(0, BUBBLE_MAX_LEN - 1).trimEnd() + "…";
}

const MD_COMPONENTS = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
  ),
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-base font-semibold mt-3 mb-1.5 first:mt-0" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-sm font-semibold mt-2.5 mb-1 first:mt-0" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-5 mb-2 space-y-0.5" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-5 mb-2 space-y-0.5" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic" {...props} />
  ),
  hr: () => <hr className="my-3 border-border/60" />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="underline underline-offset-2 hover:text-foreground"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="px-1 py-0.5 rounded bg-background/60 text-[0.85em] font-mono"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-2 p-2 rounded-md bg-background/60 text-xs font-mono overflow-x-auto"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-2 pl-3 border-l-2 border-border text-muted-foreground"
      {...props}
    />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-2 overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs border-collapse" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-background/50" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-2 py-1.5 text-left font-semibold border-b border-border"
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-2 py-1.5 border-b border-border/50 align-top" {...props} />
  ),
};

const FALLBACK_SUGGESTIONS: AssistantSuggestion[] = [
  { label: "Ko mi duguje?", prompt: "Pokaži mi sve učenike koji duguju, sortirano po iznosu." },
  { label: "Kako da zakažem čas?", prompt: "Kako da zakažem novi čas?" },
  { label: "Gde su mi domaći?", prompt: "Gde mogu da vidim domaće zadatke?" },
  { label: "Pokaži aktivnost", prompt: "Šta se dešavalo poslednjih dana?" },
];

export function ChatPanel({
  fullPage = false,
}: {
  fullPage?: boolean;
}) {
  const {
    messages,
    setMessages,
    history,
    setHistory,
    setOpen,
    setBubble,
  } = useAssistant();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>(
    FALLBACK_SUGGESTIONS,
  );
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Fetch context-aware suggestions once when the empty-state is shown.
  useEffect(() => {
    if (messages.length > 0) return;
    let cancelled = false;
    setSuggestionsLoading(true);
    getAssistantSuggestions()
      .then((s) => {
        if (!cancelled && s.length > 0) setSuggestions(s);
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [messages.length]);

  function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text) return;

    setError(null);
    setInput("");

    const userMsg: UIMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    // Placeholder we mutate in-place as text deltas arrive.
    const placeholderId = `a-${Date.now()}`;
    const placeholder: UIMessage = {
      id: placeholderId,
      role: "assistant",
      text: "",
    };
    setMessages((prev) => [...prev, userMsg, placeholder]);

    startTransition(async () => {
      let res: Response;
      try {
        res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history,
            userMessage: text,
            pageContext: { path: pathname },
          }),
        });
      } catch {
        setError("Mreža je u problemu. Pokušaj ponovo.");
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        return;
      }

      if (!res.ok || !res.body) {
        let msg = "Greška.";
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          // body wasn't JSON
        }
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let accumulatedText = "";
      let proposal: Proposal | undefined;
      let navigation: { path: string; reason?: string } | undefined;
      let receivedNewTurns: HistoryMessage[] | undefined;
      let streamError: string | undefined;

      const processLine = (line: string) => {
        if (!line) return;
        let evt: Record<string, unknown>;
        try {
          evt = JSON.parse(line) as Record<string, unknown>;
        } catch {
          return;
        }
        const t = evt.type as string | undefined;
        if (t === "text" && typeof evt.delta === "string") {
          accumulatedText += evt.delta;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholderId ? { ...m, text: accumulatedText } : m,
            ),
          );
        } else if (t === "done") {
          if (Array.isArray(evt.newTurns)) {
            receivedNewTurns = evt.newTurns as HistoryMessage[];
          }
          proposal = evt.proposal as Proposal | undefined;
          navigation = evt.navigation as
            | { path: string; reason?: string }
            | undefined;
        } else if (t === "error" && typeof evt.error === "string") {
          streamError = evt.error;
        }
        // tool_call / tool_done / turn_complete: not surfaced to UI for now
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            processLine(line);
          }
        }
        if (buf.trim()) processLine(buf.trim());
      } catch {
        setError("Veza je prekinuta tokom odgovora.");
        return;
      }

      if (streamError) {
        setError(streamError);
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        return;
      }

      // Mirror server-side history (user + tool rounds + final assistant)
      if (receivedNewTurns) {
        const turns = receivedNewTurns;
        setHistory((prev) => [...prev, ...turns]);
      }

      // Attach proposal to the streamed message if one came along.
      if (proposal) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? { ...m, proposal, proposalState: "pending" }
              : m,
          ),
        );
      }

      // Auto-navigation: minimize the panel + surface a bubble.
      if (navigation?.path) {
        const path = navigation.path;
        const bubbleText = accumulatedText.trim()
          ? truncateForBubble(accumulatedText)
          : `Otvorio sam ti ${labelForPath(path)}. Želiš li još nešto?`;
        setOpen(false);
        setBubble({ text: bubbleText, path, shownAt: Date.now() });
        router.push(path);
      }
    });
  }

  function resolveProposal(
    msgId: string,
    state: "confirmed" | "rejected",
    payload?: {
      message?: string;
      newTurns?: HistoryMessage[];
      error?: string;
    },
  ) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, proposalState: state } : m,
      ),
    );
    if (state === "confirmed" && payload?.message) {
      setMessages((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          role: "assistant",
          text: `✓ ${payload.message}`,
        },
      ]);
      // Mirror the confirmation into raw history so the AI is aware of it
      // on the next turn.
      if (payload.newTurns?.length) {
        setHistory((prev) => [...prev, ...(payload.newTurns ?? [])]);
      }
    }
    if (payload?.error) setError(payload.error);
  }

  return (
    <div
      className={
        fullPage
          ? "flex flex-col"
          : "flex flex-col bg-background h-[600px] max-h-[80vh]"
      }
    >
      {/* Messages */}
      <div
        ref={scrollRef}
        className={
          fullPage
            ? "px-4 py-4 space-y-3 pb-32"
            : "flex-1 overflow-y-auto px-4 py-4 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {messages.length === 0 && (
          <div className="text-center py-8 px-2">
            <div className="inline-flex items-center justify-center size-12 rounded-2xl tile-violet mb-3">
              <Sparkles className="size-5" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium">Ćao! Šta da uradim?</p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
              Možeš da me pitaš o učenicima, naplati, rasporedu — ili da
              tražiš da nešto uradim. Pokušaj jedan od predloga ispod.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {suggestionsLoading
                ? [0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-7 w-32 rounded-md bg-secondary/60 animate-pulse"
                    />
                  ))
                : suggestions.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => send(s.prompt)}
                      disabled={pending}
                      className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-secondary transition text-left max-w-xs"
                    >
                      {s.label}
                    </button>
                  ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="space-y-1.5">
            <div
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed break-words ${
                  m.role === "user"
                    ? "bg-foreground text-background whitespace-pre-wrap"
                    : "bg-secondary"
                }`}
                style={{ overflowWrap: "anywhere" }}
              >
                {m.role === "assistant" && m.text ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MD_COMPONENTS}
                  >
                    {m.text}
                  </ReactMarkdown>
                ) : (
                  m.text || (m.proposal ? "Predlog ↓" : "...")
                )}
              </div>
            </div>
            {m.proposal && (
              <ProposalCard
                proposal={m.proposal}
                state={m.proposalState ?? "pending"}
                onResolved={(state, payload) =>
                  resolveProposal(m.id, state, payload)
                }
              />
            )}
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-lg px-3 py-2 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" strokeWidth={2} />
              <ThinkingLabel />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive inline-flex items-start gap-1.5">
            <AlertCircle className="size-3 mt-0.5 shrink-0" strokeWidth={1.75} />
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className={
          fullPage
            ? "sticky bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-md p-3 pb-5"
            : "border-t border-border p-3 pb-5"
        }
      >
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Napiši pitanje ili komandu... (Enter za slanje)"
            className="text-sm min-h-[40px] resize-none"
            disabled={pending}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => send()}
            disabled={pending || !input.trim()}
            className="h-10"
          >
            <Send className="size-3.5" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}

const THINKING_LABELS = [
  "Razmišljam…",
  "Sklapam misli…",
  "Tražim najbolji odgovor…",
  "Trenutak…",
  "Radim na tome…",
];

function ThinkingLabel() {
  const [idx, setIdx] = useState(() =>
    Math.floor(Math.random() * THINKING_LABELS.length),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((prev) => {
        // izbegavaj isti label dva puta zaredom
        let next = Math.floor(Math.random() * THINKING_LABELS.length);
        if (next === prev) next = (next + 1) % THINKING_LABELS.length;
        return next;
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block overflow-hidden">
      {/* invisible spacer rezerviše širinu za najduži label da layout ne skače */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {THINKING_LABELS.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 whitespace-nowrap bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(110deg, var(--muted-foreground) 35%, var(--foreground) 50%, var(--muted-foreground) 65%)",
            backgroundSize: "200% 100%",
            animation: "thinking-shimmer 2.4s linear infinite",
          }}
        >
          {THINKING_LABELS[idx]}
        </motion.span>
      </AnimatePresence>
      <style>{`
        @keyframes thinking-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </span>
  );
}
