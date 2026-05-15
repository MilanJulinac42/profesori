"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, X, Maximize2 } from "lucide-react";
import Link from "next/link";

const ChatPanel = dynamic(
  () => import("./chat-panel").then((m) => m.ChatPanel),
  { ssr: false, loading: () => <ChatPanelSkeleton /> },
);

function ChatPanelSkeleton() {
  return (
    <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
      Učitavanje…
    </div>
  );
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Otvori AI asistenta"
        className="fixed bottom-5 right-5 z-50 size-12 rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition print:hidden flex items-center justify-center"
      >
        {open ? (
          <X className="size-5" strokeWidth={2} />
        ) : (
          <Sparkles className="size-5" strokeWidth={1.75} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-[380px] max-w-[calc(100vw-2.5rem)] rounded-xl border border-border bg-card shadow-2xl overflow-hidden print:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-700" strokeWidth={1.75} />
              <p className="text-sm font-medium">Asistent</p>
            </div>
            <Link
              href="/asistent"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              title="Otvori puni razgovor"
            >
              <Maximize2 className="size-3" strokeWidth={1.75} />
              Puni prozor
            </Link>
          </div>
          <ChatPanel />
        </div>
      )}
    </>
  );
}
