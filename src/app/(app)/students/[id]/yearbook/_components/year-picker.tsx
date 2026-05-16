"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Year navigator for the yearbook. Doesn't fetch; just pushes a new URL.
 * Range: 3 years back, up to current year.
 */
export function YearPicker({
  studentId,
  current,
  availableYears,
}: {
  studentId: string;
  current: number;
  availableYears: number[];
}) {
  const router = useRouter();
  const minYear = Math.min(current, ...(availableYears.length ? availableYears : [current]));
  const maxYear = Math.max(current, new Date().getFullYear());

  function go(target: number) {
    router.push(`/students/${studentId}/yearbook?year=${target}`);
  }

  return (
    <div className="print:hidden inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
      <button
        type="button"
        onClick={() => go(current - 1)}
        disabled={current <= minYear}
        aria-label="Prethodna godina"
        className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
      </button>
      <span className="px-2 text-sm font-medium tabular-nums min-w-[64px] text-center">
        {current}.
      </span>
      <button
        type="button"
        onClick={() => go(current + 1)}
        disabled={current >= maxYear}
        aria-label="Sledeća godina"
        className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
