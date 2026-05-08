"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addParentCommentAction } from "@/lib/report-comments/actions";

export function ReportCommentForm({
  reportLogId,
}: {
  reportLogId: string;
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addParentCommentAction({ reportLogId, body });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSubmitted(true);
      setBody("");
    });
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 inline-flex items-center gap-2">
        <Check className="size-3.5" strokeWidth={2.5} />
        Komentar je poslat profesoru.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MessageCircle className="size-3" strokeWidth={1.75} />
        Ostavi komentar profesoru
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder='npr. "Hvala, lepo da vidim koliko Marko napreduje. Možemo li sledeću nedelju da imamo dva časa umesto jednog?"'
        className="text-sm"
        disabled={pending}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="button"
        size="sm"
        onClick={submit}
        disabled={pending || !body.trim()}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <MessageCircle className="size-3.5" strokeWidth={2} />
        )}
        Pošalji komentar
      </Button>
    </div>
  );
}
