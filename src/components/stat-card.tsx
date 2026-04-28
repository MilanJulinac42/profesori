import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 flex flex-col gap-2",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-3.5" strokeWidth={1.75} />}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground tabular-nums">{hint}</p>
      )}
    </div>
  );
}
