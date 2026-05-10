"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseParentMessageAction } from "@/lib/messages/parse";

type ParseData = {
  intent: "reschedule" | "cancel" | "praise" | "question" | "complaint" | "other";
  student_match: string | null;
  extracted_when: string | null;
  summary: string;
  suggested_action: string;
  suggested_reply: string;
};

const INTENT_LABEL: Record<ParseData["intent"], string> = {
  reschedule: "Pomeranje termina",
  cancel: "Otkazivanje časa",
  praise: "Pohvala",
  question: "Pitanje",
  complaint: "Žalba",
  other: "Drugo",
};

const INTENT_TONE: Record<ParseData["intent"], string> = {
  reschedule: "bg-amber-100 text-amber-900 border-amber-300",
  cancel: "bg-red-100 text-red-900 border-red-300",
  praise: "bg-emerald-100 text-emerald-900 border-emerald-300",
  question: "bg-blue-100 text-blue-900 border-blue-300",
  complaint: "bg-orange-100 text-orange-900 border-orange-300",
  other: "bg-secondary text-foreground border-border",
};

export function ParserForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copiedReply, setCopiedReply] = useState(false);

  function analyze() {
    setError(null);
    setResult(null);
    if (!text.trim()) return;

    startTransition(async () => {
      const res = await parseParentMessageAction(text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res.data);
    });
  }

  function copyReply() {
    if (!result) return;
    navigator.clipboard.writeText(result.suggested_reply);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 1500);
  }

  function reset() {
    setText("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="msg" className="text-xs font-medium">
          Tekst poruke od roditelja
        </label>
        <Textarea
          id="msg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='npr. "Pozdrav, da li bismo mogli da pomerimo Markov čas u utorak na sredu? U utorak imamo neku porodičnu obavezu. Hvala!"'
          rows={6}
          className="text-sm"
          disabled={pending}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={analyze}
          disabled={pending || !text.trim()}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-opacity glow-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          ) : (
            <Sparkles className="size-4" strokeWidth={2.25} />
          )}
          Analiziraj
        </button>
        {(result || error) && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center h-9 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Izbriši
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-500 dark:text-rose-400 inline-flex items-center gap-2">
          <AlertCircle className="size-4" strokeWidth={2} />
          {error}
        </div>
      )}

      {result && (
        <div className="card-elevated card-glow rounded-2xl p-5 space-y-4">
          {/* Intent */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`font-medium ${INTENT_TONE[result.intent]}`}
            >
              {INTENT_LABEL[result.intent]}
            </Badge>
            {result.student_match && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <User className="size-3" strokeWidth={1.75} />
                {result.student_match}
              </span>
            )}
            {result.extracted_when && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" strokeWidth={1.75} />
                {result.extracted_when}
              </span>
            )}
          </div>

          {/* Sažetak */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Sažetak
            </p>
            <p className="text-sm leading-relaxed">{result.summary}</p>
          </div>

          {/* Predlog akcije */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Predlog akcije
            </p>
            <p className="text-sm leading-relaxed">{result.suggested_action}</p>
          </div>

          {/* Predlog odgovora */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Predlog odgovora
              </p>
              <button
                type="button"
                onClick={copyReply}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-card border border-border text-foreground text-xs font-medium hover:bg-secondary hover:border-brand/40 transition-colors"
              >
                {copiedReply ? (
                  <Check className="size-3.5 text-emerald-500 dark:text-emerald-400" strokeWidth={2.25} />
                ) : (
                  <Copy className="size-3.5" strokeWidth={2} />
                )}
                {copiedReply ? "Kopirano" : "Kopiraj"}
              </button>
            </div>
            <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {result.suggested_reply}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
