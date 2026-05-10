import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendBadge } from "./trend-badge";
import { Sparkline } from "./sparkline";

type Tile = "cyan" | "magenta" | "rose" | "amber" | "emerald" | "violet" | "sky";

type Props = {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  tile?: Tile;
  /** percent delta vs previous period */
  delta?: number;
  /** when true, going down is good (e.g. cancellations) */
  inverseTrend?: boolean;
  /** small inline trend chart */
  spark?: { data: number[]; color?: string };
  className?: string;
};

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  tile = "cyan",
  delta,
  inverseTrend,
  spark,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "card-elevated card-glow rounded-2xl p-5 flex flex-col gap-3 min-w-0 group transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_20px_48px_-16px_oklch(0_0_0/0.4)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground">
            {label}
          </p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-xl shrink-0",
              `tile-${tile}`,
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-3xl sm:text-4xl text-foreground tabular-nums leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>

      {spark && spark.data.length > 1 && (
        <div className="-mx-1 -mb-1">
          <Sparkline
            data={spark.data}
            color={spark.color ?? "var(--brand)"}
            height={36}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto">
        {hint && (
          <p className="text-[11px] text-muted-foreground tabular-nums truncate">
            {hint}
          </p>
        )}
        {delta !== undefined && (
          <TrendBadge delta={delta} inverse={inverseTrend} />
        )}
      </div>
    </div>
  );
}
