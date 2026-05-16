"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Sparkles, X, Maximize2 } from "lucide-react";
import { useAssistant } from "./assistant-context";

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
  const { open, toggle, setOpen, bubble, setBubble } = useAssistant();

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Zatvori AI asistenta" : "Otvori AI asistenta"}
        className="fixed bottom-5 right-5 z-50 size-12 rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition print:hidden flex items-center justify-center"
      >
        {open ? (
          <X className="size-5" strokeWidth={2} />
        ) : (
          <Sparkles className="size-5" strokeWidth={1.75} />
        )}
      </button>

      {/* Post-redirect bubble — appears only when panel is minimized */}
      {!open && bubble && (
        <button
          key={bubble.shownAt}
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-5 z-40 max-w-[calc(100vw-2.5rem)] sm:max-w-sm rounded-2xl border border-border bg-card shadow-xl px-4 py-3 text-left text-sm leading-relaxed flex items-start gap-2.5 print:hidden animate-assistant-bubble"
          aria-label="Otvori asistenta — nova poruka"
        >
          <span className="mt-0.5 flex size-6 items-center justify-center rounded-full tile-violet shrink-0">
            <Sparkles className="size-3.5" strokeWidth={2} />
          </span>
          <span className="flex-1 min-w-0">{bubble.text}</span>
          <span
            role="button"
            tabIndex={0}
            aria-label="Sakrij oblačić"
            onClick={(e) => {
              e.stopPropagation();
              setBubble(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setBubble(null);
              }
            }}
            className="size-5 -mr-1 -mt-1 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer shrink-0"
          >
            <X className="size-3.5" strokeWidth={2} />
          </span>
        </button>
      )}

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
