"use client";

import { useState, useTransition } from "react";
import { Mic, Pencil, Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/voice-recorder";
import { generateLessonDraft } from "@/lib/lessons/actions";
import type { LessonDraft } from "@/lib/lessons/transcribe";
import { cn } from "@/lib/utils";

type Tab = "voice" | "type";

export type FilledDraft = LessonDraft & {
  transcript_raw: string | null;
};

type Props = {
  lessonId: string;
  /**
   * Pozvano kad AI vrati draft. Parent forma popunjava polja iz njega.
   * Profesor onda može da edituje pre konačnog "Sačuvaj".
   */
  onDraft: (draft: FilledDraft) => void;
};

export function AINoteCapture({ lessonId, onDraft }: Props) {
  const [tab, setTab] = useState<Tab>("voice");
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleAudio(file: File) {
    const fd = new FormData();
    fd.set("lesson_id", lessonId);
    fd.set("audio", file);
    submit(fd);
  }

  function handleTyped() {
    if (!typed.trim()) {
      setError("Unesi par rečenica.");
      return;
    }
    const fd = new FormData();
    fd.set("lesson_id", lessonId);
    fd.set("typed_text", typed);
    submit(fd);
  }

  function submit(fd: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await generateLessonDraft(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onDraft({ ...res.draft, transcript_raw: res.transcript });
      setSuccess(true);
      setTyped("");
    });
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-xs font-medium">AI asistent — popuni beleške za 30s</p>
        </div>
        {success && (
          <span className="text-[11px] text-foreground inline-flex items-center gap-1">
            <Check className="size-3" strokeWidth={2} />
            Popunjeno
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-md bg-background p-0.5 border border-border">
        <TabButton
          active={tab === "voice"}
          onClick={() => setTab("voice")}
          icon={Mic}
          label="Snimi"
        />
        <TabButton
          active={tab === "type"}
          onClick={() => setTab("type")}
          icon={Pencil}
          label="Otkucaj"
        />
      </div>

      {pending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          AI obrađuje belešku...
        </div>
      ) : tab === "voice" ? (
        <div className="space-y-2">
          <VoiceRecorder onRecorded={handleAudio} disabled={pending} />
          <p className="text-[11px] text-muted-foreground">
            Govori prirodno na srpskom: o čemu ste pričali, kako je išlo, šta sledeći put. AI strukturira ostalo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            rows={3}
            placeholder="npr. Vežbali smo razlomke, dobro je razumeo sabiranje ali muci ga deljenje. Za sledeći put zadati 5 zadataka iz deljenja razlomaka."
          />
          <Button
            type="button"
            size="sm"
            onClick={handleTyped}
            disabled={pending || !typed.trim()}
          >
            <Sparkles className="size-3.5" strokeWidth={2} />
            Strukturiraj
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mic;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 rounded text-xs px-2 py-1.5 transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
