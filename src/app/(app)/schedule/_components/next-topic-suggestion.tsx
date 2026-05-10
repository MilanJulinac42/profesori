"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, Loader2, RefreshCw, X } from "lucide-react";
import { suggestNextTopicAction } from "@/lib/lessons/ai-suggest";

type Suggestion = { topic: string; reason: string };

type State =
  | { kind: "idle" } // before user clicks "Generiši plan"
  | { kind: "loading" }
  | { kind: "ok"; data: Suggestion }
  | { kind: "error"; message: string };

export function NextTopicSuggestion({ studentId }: { studentId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  // Reset state kada se promeni učenik (ne auto-fetch — čekamo klik).
  useEffect(() => {
    setState({ kind: "idle" });
    setHidden(false);
  }, [studentId]);

  function load() {
    if (!studentId) return;
    setHidden(false);
    setState({ kind: "loading" });
    startTransition(async () => {
      const res = await suggestNextTopicAction(studentId);
      if (res.ok) {
        setState({ kind: "ok", data: { topic: res.topic, reason: res.reason } });
      } else {
        setState({ kind: "error", message: res.error });
      }
    });
  }

  if (hidden) return null;

  // Idle — klik da generiše
  if (state.kind === "idle") {
    return (
      <button
        type="button"
        onClick={load}
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand/40 bg-brand-soft/50 dark:bg-brand/10 hover:bg-brand-soft dark:hover:bg-brand/15 text-brand text-xs font-semibold h-8 px-3 transition-colors"
      >
        <Sparkles className="size-3.5" strokeWidth={2.25} />
        Generiši AI plan za sledeći čas
      </button>
    );
  }

  if (state.kind === "loading") {
    return (
      <div className="rounded-lg border border-brand/30 bg-brand-soft/40 dark:bg-brand/10 px-3 py-2 flex items-center gap-2 text-xs text-brand font-medium">
        <Loader2 className="size-3.5 animate-spin shrink-0" strokeWidth={2} />
        AI razmišlja šta bi bilo dobro raditi sledeći put…
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <Sparkles className="size-3 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{state.message}</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={load}
            disabled={pending}
            aria-label="Pokušaj ponovo"
            className="hover:text-foreground p-1 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`size-3 ${pending ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
          </button>
          <button
            type="button"
            onClick={() => setHidden(true)}
            aria-label="Sakrij"
            className="hover:text-foreground p-1 transition-colors"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  // OK — prikaz predloga
  return (
    <div className="rounded-xl border border-brand/30 bg-brand-soft/40 dark:bg-brand/10 px-3 py-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex size-7 items-center justify-center rounded-lg tile-violet shrink-0 mt-0.5">
            <Sparkles className="size-3.5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand">
              AI predlog za sledeći čas
            </p>
            <p className="text-sm font-semibold text-foreground mt-1">
              {state.data.topic}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {state.data.reason}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={load}
            disabled={pending}
            aria-label="Generiši nov predlog"
            className="text-muted-foreground hover:text-foreground p-1 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`size-3 ${pending ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
          </button>
          <button
            type="button"
            onClick={() => setHidden(true)}
            aria-label="Sakrij"
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
