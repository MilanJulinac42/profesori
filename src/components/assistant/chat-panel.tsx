"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { sendChatMessage } from "@/lib/assistant/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProposalCard } from "./proposal-card";
import type { Proposal, UIMessage } from "./types";

const SUGGESTIONS = [
  "Daj mi istoriju za Marka",
  "Zakazi cas Marka u utorak u 17h, 60 min, default cena",
  "Ko mi sve duguje preko 5000?",
  "Otkaži Markov sledeći čas, otkazao učenik",
];

export function ChatPanel({
  fullPage = false,
}: {
  fullPage?: boolean;
}) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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
    setMessages((prev) => [...prev, userMsg]);

    startTransition(async () => {
      const res = await sendChatMessage({
        conversationId: conversationId ?? undefined,
        userMessage: text,
        pageContext: { path: pathname },
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      if (!conversationId) setConversationId(res.conversationId);

      // Ekstrahuj plain text iz Anthropic content blokova
      const textBlocks = res.assistantMessage
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n");

      const aMsg: UIMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: textBlocks,
        proposal: res.proposal as Proposal | undefined,
        proposalState: res.proposal ? "pending" : undefined,
      };

      setMessages((prev) => [...prev, aMsg]);

      // Auto-navigation tool result
      if (res.navigation?.path) {
        router.push(res.navigation.path);
      }
    });
  }

  function resolveProposal(
    msgId: string,
    state: "confirmed" | "rejected",
    message?: string,
    err?: string,
  ) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, proposalState: state } : m,
      ),
    );
    if (state === "confirmed" && message) {
      setMessages((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          role: "assistant",
          text: `✓ ${message}`,
        },
      ]);
    }
    if (err) setError(err);
  }

  return (
    <div
      className={`flex flex-col bg-background ${
        fullPage ? "h-[calc(100vh-3.5rem)]" : "h-[600px] max-h-[80vh]"
      }`}
    >
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 px-2">
            <div className="inline-flex items-center justify-center size-10 rounded-full bg-amber-100 mb-3">
              <Sparkles className="size-5 text-amber-700" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium">Ćao! Šta da uradim?</p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
              Možeš da me pitaš o učenicima, naplati, rasporedu — ili da
              tražiš da nešto uradim. Pokušaj jedan od predloga ispod.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={pending}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-secondary transition text-left max-w-xs"
                >
                  {s}
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
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-secondary"
                }`}
              >
                {m.text || (m.proposal ? "Predlog ↓" : "...")}
              </div>
            </div>
            {m.proposal && conversationId && (
              <ProposalCard
                proposal={m.proposal}
                conversationId={conversationId}
                state={m.proposalState ?? "pending"}
                onResolved={(state, message, err) =>
                  resolveProposal(m.id, state, message, err)
                }
              />
            )}
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-lg px-3 py-2 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" strokeWidth={2} />
              Razmišljam...
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
      <div className="border-t border-border p-3">
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
