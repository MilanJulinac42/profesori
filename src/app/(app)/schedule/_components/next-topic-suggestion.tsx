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
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs h-8 px-3 transition"
      >
        <Sparkles className="size-3.5" strokeWidth={2} />
        Generiši AI plan za sledeći čas
      </button>
    );
  }

  if (state.kind === "loading") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2 text-xs text-amber-900">
        <Loader2 className="size-3.5 animate-spin shrink-0" strokeWidth={2} />
        AI razmišlja šta bi bilo dobro raditi sledeći put...
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
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
            className="hover:text-foreground p-1 disabled:opacity-50"
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
            className="hover:text-foreground p-1"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  // OK — prikaz predloga
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Sparkles
            className="size-3.5 text-amber-700 mt-0.5 shrink-0"
            strokeWidth={1.75}
          />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-amber-800 font-medium">
              AI predlog za sledeći čas
            </p>
            <p className="text-sm font-medium text-amber-950 mt-0.5">
              {state.data.topic}
            </p>
            <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
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
            className="text-amber-700 hover:text-amber-900 p-1 disabled:opacity-50"
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
            className="text-amber-700 hover:text-amber-900 p-1"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
