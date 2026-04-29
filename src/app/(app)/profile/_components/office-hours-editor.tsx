"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OfficeHoursMap } from "@/lib/public-profile/types";

const DAY_LABELS: { key: string; label: string }[] = [
  { key: "1", label: "Pon" },
  { key: "2", label: "Uto" },
  { key: "3", label: "Sre" },
  { key: "4", label: "Čet" },
  { key: "5", label: "Pet" },
  { key: "6", label: "Sub" },
  { key: "0", label: "Ned" },
];

const DEFAULT_HOURS: OfficeHoursMap = {
  "0": null,
  "1": { start: 16, end: 21 },
  "2": { start: 16, end: 21 },
  "3": { start: 16, end: 21 },
  "4": { start: 16, end: 21 },
  "5": { start: 16, end: 21 },
  "6": { start: 10, end: 18 },
};

export function OfficeHoursEditor({
  value,
  onChange,
}: {
  value: OfficeHoursMap | null;
  onChange: (next: OfficeHoursMap) => void;
}) {
  const current: OfficeHoursMap = value ?? DEFAULT_HOURS;

  function update(key: string, next: { start: number; end: number } | null) {
    onChange({ ...current, [key]: next });
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {DAY_LABELS.map(({ key, label }) => {
          const day = current[key];
          const open = day != null;
          return (
            <div
              key={key}
              className={cn(
                "px-4 py-3 flex items-center gap-3",
                !open && "opacity-50",
              )}
            >
              <div className="w-12 text-sm font-medium">{label}</div>
              <button
                type="button"
                role="switch"
                aria-checked={open}
                onClick={() =>
                  update(key, open ? null : { start: 16, end: 21 })
                }
                className={cn(
                  "inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  open ? "bg-foreground" : "bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "inline-block size-4 rounded-full bg-background transition-transform",
                    open ? "translate-x-[18px]" : "translate-x-0.5",
                  )}
                />
              </button>
              {open ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={day.start}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n))
                        update(key, { start: n, end: day.end });
                    }}
                    className="h-9 w-16 text-sm tabular-nums text-center"
                  />
                  <span className="text-xs text-muted-foreground">do</span>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={day.end}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n))
                        update(key, { start: day.start, end: n });
                    }}
                    className="h-9 w-16 text-sm tabular-nums text-center"
                  />
                  <span className="text-xs text-muted-foreground">h</span>
                </div>
              ) : (
                <div className="flex-1 text-xs text-muted-foreground">
                  Zatvoreno
                </div>
              )}
            </div>
          );
        })}
      </div>
      <input
        type="hidden"
        name="office_hours"
        value={JSON.stringify(current)}
      />
    </div>
  );
}
