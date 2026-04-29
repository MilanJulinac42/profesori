"use client";

import type { CalendarDay } from "@/lib/public-profile/availability";
import { cn } from "@/lib/utils";

export function CalendarWidget({ days }: { days: CalendarDay[] }) {
  function pickSlot(day: CalendarDay, time: string) {
    // Build a friendly Serbian label for the message prefill.
    const dt = new Date(`${day.date}T${time}:00`);
    const dateLabel = dt.toLocaleDateString("sr-Latn-RS", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const message = `Voleo bih da rezervišem termin: ${dateLabel} u ${time}h.`;

    const ta = document.getElementById("message");
    if (ta && (ta as HTMLTextAreaElement).tagName === "TEXTAREA") {
      const textarea = ta as HTMLTextAreaElement;
      // Use the native value setter so React + base-ui pick up the change.
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      if (setter) {
        setter.call(textarea, message);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        textarea.value = message;
      }
    }

    document
      .getElementById("booking")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
      {days.map((d) => (
        <DayCard key={d.date} day={d} onPick={(t) => pickSlot(d, t)} />
      ))}
    </div>
  );
}

function DayCard({
  day,
  onPick,
}: {
  day: CalendarDay;
  onPick: (time: string) => void;
}) {
  const visibleSlots = day.slots.filter((s) => !s.past);
  const allBusy = visibleSlots.length > 0 && visibleSlots.every((s) => s.busy);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 flex flex-col",
        day.isToday ? "border-foreground/30" : "border-border",
      )}
    >
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <p
            className={cn(
              "text-[10px] uppercase tracking-wider",
              day.isToday ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {day.weekdayShort.replace(".", "")}
          </p>
          <p
            className={cn(
              "text-base font-medium tabular-nums leading-tight",
              day.isToday &&
                "inline-flex size-7 items-center justify-center rounded-full bg-foreground text-background",
            )}
          >
            {day.dayNum}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {day.monthShort.replace(".", "")}
        </span>
      </div>

      <div className="flex-1 min-h-[3rem] flex flex-col gap-1">
        {day.closed && (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            Zatvoreno
          </p>
        )}
        {!day.closed && visibleSlots.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            Prošlo
          </p>
        )}
        {!day.closed && allBusy && (
          <p className="text-[11px] text-muted-foreground text-center mb-1">
            Sve zauzeto
          </p>
        )}
        {visibleSlots.map((s) => (
          <button
            key={s.time}
            type="button"
            onClick={() => !s.busy && onPick(s.time)}
            disabled={s.busy}
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-xs tabular-nums transition-colors",
              s.busy
                ? "bg-secondary/40 text-muted-foreground/60 line-through cursor-not-allowed"
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 cursor-pointer font-medium",
            )}
          >
            {s.time}
          </button>
        ))}
      </div>
    </div>
  );
}
