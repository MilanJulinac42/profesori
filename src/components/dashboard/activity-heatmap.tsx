import { getISODay, parseISO, format } from "date-fns";
import { sr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { AnalyticsPeriod } from "@/lib/analytics/queries";
import { PERIOD_LABELS } from "@/lib/analytics/queries";

type Day = {
  iso: string;
  label: string;
  held: number;
  revenue: number;
};

type Props = {
  days: Day[];
  period: AnalyticsPeriod;
  granularity: "daily" | "weekly";
  className?: string;
};

// Latin only, no diacritics — clean and consistent
const DAY_LABELS = ["Pon", "Uto", "Sre", "Cet", "Pet", "Sub", "Ned"];

export function ActivityHeatmap({
  days,
  period,
  granularity,
  className,
}: Props) {
  const max = Math.max(...days.map((d) => d.held), 1);
  const granLabel = granularity === "weekly" ? "po nedelji" : "po danu";
  const headerLabel = `Aktivnost · ${PERIOD_LABELS[period].toLowerCase()}`;

  return (
    <div className={cn("flex flex-col gap-3 min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
          {headerLabel}
        </p>
        <Legend />
      </div>

      {granularity === "weekly" ? (
        <WeeklyStrip days={days} max={max} />
      ) : period === "week" ? (
        <WeekRow days={days} max={max} />
      ) : (
        <GithubGrid days={days} max={max} />
      )}

      <p className="text-[10px] text-muted-foreground/70">{granLabel}</p>
    </div>
  );
}

/* ---------- Daily, full period: 7-row × N-col grid, fixed cell sizes ---------- */
function GithubGrid({ days, max }: { days: Day[]; max: number }) {
  if (days.length === 0) return null;

  const firstDow = getISODay(parseISO(days[0]!.iso));
  const padBefore = firstDow - 1;

  const padded: (Day | null)[] = [
    ...Array(padBefore).fill(null),
    ...days,
  ];
  while (padded.length % 7 !== 0) padded.push(null);
  const cols = padded.length / 7;

  // Adaptive cell size: fewer cols = larger cells, more cols = smaller
  const cellSize = cols <= 6 ? 26 : cols <= 12 ? 22 : cols <= 20 ? 18 : 14;
  const gap = cellSize >= 22 ? 6 : 4;

  return (
    <div className="flex" style={{ gap: `${gap}px` }}>
      {/* Day labels — one per row, aligned exactly with cells */}
      <div className="flex flex-col shrink-0" style={{ gap: `${gap}px` }}>
        {DAY_LABELS.map((d, i) => (
          <span
            key={i}
            className="text-[10px] text-muted-foreground/70 leading-none flex items-center pr-1.5 tabular-nums"
            style={{ height: `${cellSize}px` }}
          >
            {d}
          </span>
        ))}
      </div>

      {Array.from({ length: cols }).map((_, c) => (
        <div key={c} className="flex flex-col" style={{ gap: `${gap}px` }}>
          {Array.from({ length: 7 }).map((_, r) => (
            <Cell
              key={r}
              day={padded[c * 7 + r] ?? null}
              max={max}
              mode="day"
              size={cellSize}
              tooltipBelow={r < 3}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- Weekly buckets: single horizontal strip ---------- */
function WeeklyStrip({ days, max }: { days: Day[]; max: number }) {
  // Adaptive size based on count
  const cellSize = days.length <= 8 ? 30 : days.length <= 16 ? 24 : 20;
  return (
    <div className="flex" style={{ gap: "6px" }}>
      {days.map((day, i) => (
        <Cell
          key={i}
          day={day}
          max={max}
          mode="week"
          size={cellSize}
          tooltipBelow
        />
      ))}
    </div>
  );
}

/* ---------- Single week (7 cells, large) ---------- */
function WeekRow({ days, max }: { days: Day[]; max: number }) {
  const padded: (Day | null)[] = [];
  if (days.length > 0) {
    const firstDow = getISODay(parseISO(days[0]!.iso));
    for (let i = 0; i < firstDow - 1; i++) padded.push(null);
  }
  padded.push(...days);
  while (padded.length < 7) padded.push(null);
  const cells = padded.slice(0, 7);

  const cellSize = 36;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex" style={{ gap: "8px" }}>
        {DAY_LABELS.map((d, i) => (
          <span
            key={i}
            className="text-center text-[10px] text-muted-foreground/70 tabular-nums"
            style={{ width: `${cellSize}px` }}
          >
            {d}
          </span>
        ))}
      </div>
      <div className="flex" style={{ gap: "8px" }}>
        {cells.map((day, i) => (
          <Cell
            key={i}
            day={day}
            max={max}
            mode="day"
            size={cellSize}
            tooltipBelow
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Cell with tooltip ---------- */
function Cell({
  day,
  max,
  mode,
  size,
  tooltipBelow = false,
}: {
  day: Day | null;
  max: number;
  mode: "day" | "week";
  size: number;
  tooltipBelow?: boolean;
}) {
  const sizeStyle = { width: `${size}px`, height: `${size}px` };

  if (!day) {
    return (
      <div
        className="rounded-[5px] bg-muted/30 dark:bg-muted/30"
        style={sizeStyle}
      />
    );
  }

  const intensity =
    day.held === 0 ? 0 : Math.min(4, Math.ceil((day.held / max) * 4));

  const cls = [
    "bg-[oklch(0.92_0.01_220)] dark:bg-[oklch(0.27_0.04_268)]",
    "bg-[oklch(0.85_0.1_205)] dark:bg-[oklch(0.7_0.18_205/0.32)]",
    "bg-[oklch(0.74_0.16_205)] dark:bg-[oklch(0.72_0.2_205/0.55)]",
    "bg-[oklch(0.62_0.2_205)] dark:bg-[oklch(0.74_0.22_205/0.8)]",
    "bg-[oklch(0.55_0.22_205)] dark:bg-[oklch(0.78_0.24_205)]",
  ][intensity];

  const glow =
    intensity === 4
      ? "shadow-[0_0_10px_-1px_oklch(0.55_0.22_205/0.5)] dark:shadow-[0_0_10px_-1px_oklch(0.78_0.16_205/0.6)]"
      : "";

  const dt = parseISO(day.iso);
  const dateLong =
    mode === "week"
      ? `Nedelja od ${format(dt, "d. MMMM", { locale: sr })}`
      : format(dt, "EEEE, d. MMMM", { locale: sr });
  const heldLine =
    day.held === 0
      ? "bez časova"
      : `${day.held} ${day.held === 1 ? "čas" : day.held < 5 ? "časa" : "časova"} održano`;

  const tooltipPos = tooltipBelow
    ? "top-full mt-2 origin-top"
    : "bottom-full mb-2 origin-bottom";
  const arrowPos = tooltipBelow
    ? "-top-1 border-l border-t"
    : "-bottom-1 border-r border-b";

  return (
    <div className="relative group/cell" style={sizeStyle}>
      <div
        className={cn(
          "size-full rounded-[5px] transition-all duration-200 group-hover/cell:scale-[1.18] group-hover/cell:ring-2 group-hover/cell:ring-brand/60 cursor-default",
          cls,
          glow,
        )}
      />
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 opacity-0 scale-95 group-hover/cell:opacity-100 group-hover/cell:scale-100 transition-all duration-150",
          tooltipPos,
        )}
      >
        <div className="whitespace-nowrap rounded-md border border-border bg-popover/95 backdrop-blur-md text-popover-foreground px-2.5 py-1.5 shadow-xl text-[11px] leading-tight">
          <div className="font-semibold capitalize">{dateLong}</div>
          <div className="text-muted-foreground tabular-nums mt-0.5">
            {heldLine}
          </div>
        </div>
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 size-2 rotate-45 bg-popover/95 border-border",
            arrowPos,
          )}
        />
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span>manje</span>
      <div className="flex gap-0.5">
        <span className="size-2.5 rounded-sm bg-[oklch(0.92_0.01_220)] dark:bg-[oklch(0.27_0.04_268)]" />
        <span className="size-2.5 rounded-sm bg-[oklch(0.85_0.1_205)] dark:bg-[oklch(0.7_0.18_205/0.32)]" />
        <span className="size-2.5 rounded-sm bg-[oklch(0.74_0.16_205)] dark:bg-[oklch(0.72_0.2_205/0.55)]" />
        <span className="size-2.5 rounded-sm bg-[oklch(0.62_0.2_205)] dark:bg-[oklch(0.74_0.22_205/0.8)]" />
        <span className="size-2.5 rounded-sm bg-[oklch(0.55_0.22_205)] dark:bg-[oklch(0.78_0.24_205)]" />
      </div>
      <span>više</span>
    </div>
  );
}
