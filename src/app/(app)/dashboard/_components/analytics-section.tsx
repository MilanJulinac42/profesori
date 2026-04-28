import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import {
  PERIOD_LABELS,
  PERIOD_OPTIONS,
  type Analytics,
  type AnalyticsPeriod,
} from "@/lib/analytics/queries";
import { formatRsd } from "@/lib/money";
import { cn } from "@/lib/utils";

export function AnalyticsSection({
  stats,
  period,
}: {
  stats: Analytics;
  period: AnalyticsPeriod;
}) {
  return (
    <section className="space-y-4">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Performanse</h2>
          <p className="text-xs text-muted-foreground">
            {PERIOD_LABELS[period]}
          </p>
        </div>
        <PeriodSelector active={period} />
      </div>

      {/* Big metrics row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BigMetric
          label="Zarađeno"
          value={formatRsd(stats.revenue, false)}
          unit="RSD"
          icon={Banknote}
          hint={
            stats.held > 0
              ? `~${formatRsd(stats.averageRevenuePerHeld, false)} RSD po času`
              : "Nema održanih časova"
          }
        />
        <BigMetric
          label="Časova održano"
          value={String(stats.held)}
          icon={CheckCircle2}
          hint={
            stats.scheduled > 0
              ? `${stats.scheduled} predstojećih u periodu`
              : undefined
          }
        />
        <BigMetric
          label="Otkazivanja"
          value={String(stats.totalCancelled)}
          icon={XCircle}
          hint={
            stats.lostRevenue > 0
              ? `${formatRsd(stats.lostRevenue)} izgubljeno`
              : "Bez izgubljenog prihoda"
          }
          tone={stats.totalCancelled > 0 ? "warning" : "default"}
        />
        <BigMetric
          label="Stopa otkazivanja"
          value={
            stats.totalLessonsTouched > 0
              ? `${Math.round(stats.cancellationRate)}%`
              : "—"
          }
          icon={TrendingDown}
          hint={
            stats.totalLessonsTouched > 0
              ? `${stats.totalCancelled} od ${stats.totalLessonsTouched} časova`
              : "Nema podataka"
          }
        />
      </div>

      {/* Detail cards */}
      <div className="grid gap-3 lg:grid-cols-2">
        <CancellationBreakdown stats={stats} />
        <TopStudents students={stats.topStudents} />
      </div>
    </section>
  );
}

/* ---------- period selector ---------- */
function PeriodSelector({ active }: { active: AnalyticsPeriod }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 text-xs">
      {PERIOD_OPTIONS.map((p) => {
        const isActive = active === p;
        const href = p === "month" ? "/dashboard" : `/dashboard?period=${p}`;
        return (
          <Link
            key={p}
            href={href}
            scroll={false}
            className={cn(
              "rounded-[4px] px-2.5 py-1 transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            {PERIOD_LABELS[p].replace("Poslednjih ", "")}
          </Link>
        );
      })}
    </div>
  );
}

/* ---------- big metric ---------- */
function BigMetric({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 min-h-[110px]">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs">{label}</span>
        <Icon
          className={cn(
            "size-3.5",
            tone === "warning" && "text-foreground/70",
          )}
          strokeWidth={1.75}
        />
      </div>
      <div className="flex items-baseline gap-1.5 mt-auto">
        <span className="text-2xl font-medium tracking-tight tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
      {hint && (
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ---------- cancellation breakdown ---------- */
function CancellationBreakdown({ stats }: { stats: Analytics }) {
  const total = stats.totalCancelled;
  const items = [
    {
      label: "Otkazao učenik",
      count: stats.cancelledByStudent,
      tone: "neutral" as const,
    },
    {
      label: "Otkazao profesor",
      count: stats.cancelledByTeacher,
      tone: "neutral" as const,
    },
    {
      label: "Nije se pojavio",
      count: stats.noShow,
      tone: "danger" as const,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Otkazivanja po razlogu</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total === 0
              ? "Nema otkazanih časova"
              : `${total} ukupno otkazanih`}
          </p>
        </div>
        <XCircle
          className="size-4 text-muted-foreground"
          strokeWidth={1.75}
        />
      </div>
      {total === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            Sve čisto u ovom periodu.
          </p>
        </div>
      ) : (
        <ul className="px-5 py-4 space-y-3">
          {items.map((item) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <li key={item.label} className="space-y-1">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="tabular-nums font-medium">
                    {item.count}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      item.tone === "danger"
                        ? "bg-destructive"
                        : "bg-foreground",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
          {stats.lostRevenue > 0 && (
            <li className="pt-3 border-t border-border flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Izgubljen prihod</span>
              <span className="tabular-nums font-medium text-destructive">
                {formatRsd(stats.lostRevenue)}
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ---------- top students ---------- */
function TopStudents({
  students,
}: {
  students: Analytics["topStudents"];
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Najbolji učenici</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Po prihodu u ovom periodu
          </p>
        </div>
        <Trophy
          className="size-4 text-muted-foreground"
          strokeWidth={1.75}
        />
      </div>
      {students.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            Još nema održanih časova u ovom periodu.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {students.map((s, i) => (
            <li key={s.id} className="px-5 py-3">
              <Link
                href={`/students/${s.id}`}
                className="flex items-center gap-3 group"
              >
                <span className="text-xs text-muted-foreground tabular-nums w-4 text-right">
                  {i + 1}
                </span>
                <Avatar name={s.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:underline underline-offset-4">
                    {s.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.lessons}{" "}
                    {s.lessons === 1
                      ? "čas"
                      : s.lessons < 5
                        ? "časa"
                        : "časova"}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatRsd(s.revenue)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-muted-foreground">
      {initials || "?"}
    </span>
  );
}
