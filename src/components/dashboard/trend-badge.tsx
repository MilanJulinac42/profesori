import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  delta: number; // percent, e.g. 12.5 means +12.5%
  inverse?: boolean; // true when going DOWN is good (e.g. cancellations)
  size?: "sm" | "md";
  className?: string;
  /** Kratak label koji se pojavljuje pored badge-a, npr. "vs prošli mesec". */
  compareLabel?: string;
};

export function TrendBadge({
  delta,
  inverse = false,
  size = "sm",
  className,
  compareLabel,
}: Props) {
  const isFlat = Math.abs(delta) < 0.5;
  const isUp = delta > 0;

  const isGood = isFlat ? null : inverse ? !isUp : isUp;

  const tone =
    isGood === null
      ? "neutral"
      : isGood
        ? "good"
        : "bad";

  const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-1.5 py-0.5 gap-0.5 [&_svg]:size-3"
      : "text-xs px-2 py-1 gap-1 [&_svg]:size-3.5";

  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium tabular-nums",
        sizeClasses,
        tone === "good" && "bg-success/15 text-success",
        tone === "bad" && "bg-destructive/15 text-destructive",
        tone === "neutral" && "bg-muted text-muted-foreground",
        !compareLabel && className,
      )}
      title={compareLabel ? `${Math.abs(delta).toFixed(1)}% ${compareLabel}` : undefined}
    >
      <Icon strokeWidth={2.5} />
      {Math.abs(delta).toFixed(1)}%
    </span>
  );

  if (!compareLabel) return badge;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {badge}
      <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground whitespace-nowrap">
        {compareLabel}
      </span>
    </span>
  );
}
