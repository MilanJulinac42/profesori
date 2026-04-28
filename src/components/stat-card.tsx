import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "warning" | "danger";
  className?: string;
}) {
  const toneClasses = {
    default: "bg-secondary text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    warning: "bg-accent/30 text-accent-foreground",
    danger: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              toneClasses,
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="font-heading text-3xl tracking-tight">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
