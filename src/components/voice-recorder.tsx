"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "recording"; startedAt: number }
  | { kind: "stopped"; blob: Blob; durationMs: number }
  | { kind: "error"; message: string };

type Props = {
  onRecorded: (file: File, durationMs: number) => void;
  /** Disabled spolja (npr. dok traje upload). */
  disabled?: boolean;
  /** Maksimalna dužina snimka u sekundama (default 5min). */
  maxSeconds?: number;
};

/**
 * Browser-based voice recorder. Koristi MediaRecorder API.
 * Auto-detektuje najbolji audio codec (webm/opus na desktop-u, mp4 na iOS).
 */
export function VoiceRecorder({
  onRecorded,
  disabled,
  maxSeconds = 300,
}: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Tick za prikaz vremena.
  useEffect(() => {
    if (state.kind !== "recording") return;
    const id = window.setInterval(() => {
      const sec = Math.floor((Date.now() - state.startedAt) / 1000);
      setElapsedSec(sec);
      if (sec >= maxSeconds) stop();
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind, maxSeconds]);

  // Cleanup pri unmount-u.
  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    if (disabled) return;
    setState({ kind: "requesting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const durationMs = Date.now() - startedAtRef.current;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setState({ kind: "stopped", blob, durationMs });

        // Direktno emitujemo file callback.
        const ext = mimeToExt(type);
        const file = new File([blob], `voice-note.${ext}`, { type });
        onRecorded(file, durationMs);
      };

      startedAtRef.current = Date.now();
      setElapsedSec(0);
      recorder.start();
      setState({ kind: "recording", startedAt: startedAtRef.current });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.name === "NotAllowedError"
            ? "Mikrofon nije dozvoljen. Dozvoli pristup u podešavanjima browser-a."
            : err.message
          : "Greška pri snimanju.";
      setState({ kind: "error", message: msg });
    }
  }

  function stop() {
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" strokeWidth={1.75} />
          <p>{state.message}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setState({ kind: "idle" })}
        >
          Pokušaj ponovo
        </Button>
      </div>
    );
  }

  if (state.kind === "stopped") {
    return (
      <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
        Snimak gotov ({formatTime(Math.floor(state.durationMs / 1000))}). Obrada u toku...
      </div>
    );
  }

  if (state.kind === "recording") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="size-3 rounded-full bg-destructive animate-pulse" />
          <div>
            <p className="text-sm font-medium">Snimam...</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatTime(elapsedSec)} / {formatTime(maxSeconds)}
            </p>
          </div>
        </div>
        <Button type="button" onClick={stop} variant="outline">
          <Square className="size-4 fill-current" strokeWidth={1.75} />
          Zaustavi
        </Button>
      </div>
    );
  }

  if (state.kind === "requesting") {
    return (
      <Button type="button" disabled>
        <Loader2 className="size-4 animate-spin" strokeWidth={2} />
        Tražim dozvolu za mikrofon...
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={start}
      disabled={disabled}
      className={cn("w-full sm:w-auto")}
    >
      <Mic className="size-4" strokeWidth={2} />
      Snimi belešku
    </Button>
  );
}

/* ---------- helpers ---------- */

function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return null;
}

function mimeToExt(mime: string): string {
  if (mime.startsWith("audio/webm")) return "webm";
  if (mime.startsWith("audio/mp4")) return "m4a";
  if (mime.startsWith("audio/ogg")) return "ogg";
  if (mime.startsWith("audio/wav")) return "wav";
  return "audio";
}

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
