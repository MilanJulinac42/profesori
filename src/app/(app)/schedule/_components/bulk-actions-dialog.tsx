"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CalendarX,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LessonStatus } from "@/lib/lessons/types";
import {
  bulkCancelLessons,
  bulkRescheduleLessons,
} from "@/lib/lessons/bulk-actions";

type Mode = "cancel" | "reschedule";
type Preset = "today" | "tomorrow" | "rest_of_week" | "next_week" | "custom";

const PRESET_LABELS: Record<Preset, string> = {
  today: "Danas",
  tomorrow: "Sutra",
  rest_of_week: "Ostatak nedelje",
  next_week: "Sledeća nedelja",
  custom: "Ručno…",
};

const REASONS: { value: LessonStatus; label: string }[] = [
  { value: "cancelled_by_teacher", label: "Otkazao profesor" },
  { value: "cancelled_by_student", label: "Otkazao učenik" },
  { value: "no_show", label: "Učenik se nije pojavio" },
];

function rangeFor(preset: Preset): { from: Date; to: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const tomorrow = new Date(start);
  tomorrow.setDate(start.getDate() + 1);

  switch (preset) {
    case "today": {
      return { from: now, to: tomorrow };
    }
    case "tomorrow": {
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(tomorrow.getDate() + 1);
      return { from: tomorrow, to: dayAfter };
    }
    case "rest_of_week": {
      // From now until next Monday 00:00 (week starts Monday).
      const day = (now.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
      const daysToNextMonday = 7 - day;
      const end = new Date(start);
      end.setDate(start.getDate() + daysToNextMonday);
      return { from: now, to: end };
    }
    case "next_week": {
      const day = (now.getDay() + 6) % 7;
      const daysToNextMonday = 7 - day;
      const nextMon = new Date(start);
      nextMon.setDate(start.getDate() + daysToNextMonday);
      const after = new Date(nextMon);
      after.setDate(nextMon.getDate() + 7);
      return { from: nextMon, to: after };
    }
    case "custom":
      // Caller fills these via inputs.
      return { from: now, to: tomorrow };
  }
}

function toLocalInputValue(d: Date): string {
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60_000);
  return local.toISOString().slice(0, 16);
}

export function BulkActionsDialog({
  initialMode,
  onClose,
}: {
  initialMode: Mode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [preset, setPreset] = useState<Preset>("tomorrow");
  const [customFrom, setCustomFrom] = useState<string>(
    toLocalInputValue(rangeFor("tomorrow").from),
  );
  const [customTo, setCustomTo] = useState<string>(
    toLocalInputValue(rangeFor("tomorrow").to),
  );
  const [reason, setReason] = useState<LessonStatus>("cancelled_by_teacher");
  const [offsetMinutes, setOffsetMinutes] = useState<number>(60);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ affected: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const window = useMemo(() => {
    if (preset !== "custom") return rangeFor(preset);
    return {
      from: new Date(customFrom),
      to: new Date(customTo),
    };
  }, [preset, customFrom, customTo]);

  function go() {
    setError(null);
    if (!Number.isFinite(window.from.getTime()) || !Number.isFinite(window.to.getTime())) {
      setError("Datumi nisu validni.");
      return;
    }
    if (window.to <= window.from) {
      setError("Krajnji datum mora biti posle početnog.");
      return;
    }

    startTransition(async () => {
      const fromIso = window.from.toISOString();
      const toIso = window.to.toISOString();
      const res =
        mode === "cancel"
          ? await bulkCancelLessons({ fromIso, toIso, reason })
          : await bulkRescheduleLessons({
              fromIso,
              toIso,
              offsetMinutes,
            });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone({ affected: res.affected });
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-label="Grupne akcije"
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 print:hidden"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-palette-fade"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-palette-pop">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Grupne akcije</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zatvori"
            className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {done ? (
          <div className="p-6 space-y-4 text-center">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl tile-emerald mx-auto">
              <CheckCircle2 className="size-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-base font-medium">
                {done.affected === 0
                  ? "Nije bilo časova za izmenu."
                  : `${done.affected} ${done.affected === 1 ? "čas izmenjen" : "časova izmenjeno"}.`}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                Promene su primenjene odmah.
              </p>
            </div>
            <Button type="button" onClick={onClose} className="w-full">
              U redu
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Mode tabs */}
            <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-secondary/50 p-1">
              <button
                type="button"
                onClick={() => setMode("cancel")}
                className={
                  mode === "cancel"
                    ? "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-background text-sm font-medium shadow-sm"
                    : "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-sm text-muted-foreground"
                }
              >
                <CalendarX className="size-3.5" strokeWidth={1.75} />
                Otkaži
              </button>
              <button
                type="button"
                onClick={() => setMode("reschedule")}
                className={
                  mode === "reschedule"
                    ? "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-background text-sm font-medium shadow-sm"
                    : "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-sm text-muted-foreground"
                }
              >
                <CalendarClock className="size-3.5" strokeWidth={1.75} />
                Pomeri
              </button>
            </div>

            {/* Preset / range */}
            <div className="space-y-2">
              <Label className="text-xs">Period</Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["today", "tomorrow", "rest_of_week", "next_week", "custom"] as Preset[]).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreset(p)}
                      className={
                        preset === p
                          ? "h-8 px-3 rounded-md bg-foreground text-background text-xs font-medium"
                          : "h-8 px-3 rounded-md border border-border text-xs hover:bg-secondary"
                      }
                    >
                      {PRESET_LABELS[p]}
                    </button>
                  ),
                )}
              </div>
              {preset === "custom" && (
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <div className="space-y-1">
                    <Label htmlFor="from" className="text-[11px]">
                      Od
                    </Label>
                    <Input
                      id="from"
                      type="datetime-local"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="to" className="text-[11px]">
                      Do (isključivo)
                    </Label>
                    <Input
                      id="to"
                      type="datetime-local"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {mode === "cancel" ? (
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-xs">
                  Razlog otkazivanja
                </Label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as LessonStatus)}
                  className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="offset" className="text-xs">
                  Pomak (min) — pozitivno = kasnije
                </Label>
                <div className="flex items-center gap-1.5">
                  {[-60, -30, 30, 60, 1440].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setOffsetMinutes(m)}
                      className={
                        offsetMinutes === m
                          ? "h-8 px-2.5 rounded-md bg-foreground text-background text-xs font-medium tabular-nums"
                          : "h-8 px-2.5 rounded-md border border-border text-xs tabular-nums hover:bg-secondary"
                      }
                    >
                      {m > 0 ? "+" : ""}
                      {m === 1440 ? "+1 dan" : m === -1440 ? "−1 dan" : `${m}m`}
                    </button>
                  ))}
                  <Input
                    id="offset"
                    type="number"
                    value={offsetMinutes}
                    onChange={(e) => setOffsetMinutes(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground inline-flex items-start gap-1.5">
              <AlertTriangle className="size-3 mt-0.5 shrink-0" strokeWidth={2} />
              Primenjuje se samo na časove u statusu <strong>zakazan</strong>.
              Maksimalno 200 časova po operaciji.
            </p>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={pending}
              >
                Otkaži
              </Button>
              <Button type="button" onClick={go} disabled={pending}>
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                ) : mode === "cancel" ? (
                  "Otkaži časove"
                ) : (
                  "Pomeri časove"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
