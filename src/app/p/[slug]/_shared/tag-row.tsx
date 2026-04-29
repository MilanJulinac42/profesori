import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TAG_VARIANTS = {
  primary: {
    icon: "text-foreground",
    iconBg: "bg-foreground/5 border border-foreground/10",
    pill: "bg-foreground text-background",
  },
  emerald: {
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg:
      "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/50",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    iconBg:
      "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50",
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  indigo: {
    icon: "text-indigo-600 dark:text-indigo-400",
    iconBg:
      "bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-900/50",
    pill: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
} as const;

export type TagVariant = keyof typeof TAG_VARIANTS;

export function TagRow({
  title,
  icon: Icon,
  variant,
  items,
}: {
  title: string;
  icon: LucideIcon;
  variant: TagVariant;
  items: string[];
}) {
  const v = TAG_VARIANTS[variant];
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors">
      <div className="flex items-center gap-3 shrink-0 sm:w-56">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            v.iconBg,
          )}
        >
          <Icon className={cn("size-5", v.icon)} strokeWidth={1.75} />
        </span>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="flex-1 flex flex-wrap gap-1.5 sm:justify-end">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
              v.pill,
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
