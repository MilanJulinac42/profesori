"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Sparkles, X, Maximize2, RotateCcw } from "lucide-react";
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
  const {
    open,
    toggle,
    setOpen,
    bubble,
    setBubble,
    messages,
    clearConversation,
  } = useAssistant();

  return (
    <>
      {/* Floating button — hidden on mobile when panel is open to avoid
          overlapping the sheet's close affordance. */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Zatvori AI asistenta" : "Otvori AI asistenta (Ctrl+I)"}
        title={open ? "Zatvori asistenta" : "Otvori asistenta (Ctrl+I)"}
        className={`fixed bottom-5 right-5 z-50 size-12 rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition print:hidden flex items-center justify-center ${
          open ? "max-sm:hidden" : ""
        }`}
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

      {/* Panel:
          - <sm: full-width bottom sheet (slide up), max 85vh height
          - ≥sm: floating card bottom-right */}
      {open && (
        <>
          {/* Mobile backdrop — clicking it closes the panel */}
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="sm:hidden fixed inset-0 z-30 bg-background/40 backdrop-blur-sm print:hidden"
          />
          <div
            role="dialog"
            aria-label="AI Asistent"
            className="
              fixed z-40 print:hidden bg-card border border-border shadow-2xl
              max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[88vh] max-sm:animate-assistant-sheet-up
              sm:bottom-20 sm:right-5 sm:w-[380px] sm:max-w-[calc(100vw-2.5rem)] sm:rounded-xl
              overflow-hidden flex flex-col
            "
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles
                  className="size-4 text-amber-700 shrink-0"
                  strokeWidth={1.75}
                />
                <p className="text-sm font-medium truncate">Asistent</p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const ok = window.confirm(
                        "Obrisati tekuću konverzaciju?",
                      );
                      if (ok) clearConversation();
                    }}
                    aria-label="Novi razgovor (obriši istoriju)"
                    title="Novi razgovor"
                    className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <RotateCcw className="size-3.5" strokeWidth={2} />
                  </button>
                )}
                <Link
                  href="/asistent"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
                  title="Otvori puni razgovor"
                >
                  <Maximize2 className="size-3" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Puni prozor</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Zatvori"
                  className="sm:hidden inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>
            <ChatPanel />
          </div>
        </>
      )}
    </>
  );
}
