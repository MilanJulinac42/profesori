import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string = string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  /** Renders a small dot when truthy. Combines well with no badge count. */
  dot?: boolean;
};

type Props<T extends string> = {
  basePath: string;
  active: T;
  tabs: TabItem<T>[];
  /** key in the URL search param. Default: "tab" */
  param?: string;
  /** preserve other params (e.g. filters) when switching tabs */
  preserve?: Record<string, string | undefined>;
  className?: string;
};

/**
 * URL-based tab navigation. Each tab is a Link → server re-renders the page
 * with only the active tab's data fetched. Smooth visual: bottom border for
 * the active tab, hover state, optional badge counts.
 */
export function TabNav<T extends string>({
  basePath,
  active,
  tabs,
  param = "tab",
  preserve,
  className,
}: Props<T>) {
  const buildHref = (value: T) => {
    const u = new URLSearchParams();
    if (preserve) {
      for (const [k, v] of Object.entries(preserve)) {
        if (v) u.set(k, v);
      }
    }
    u.set(param, value);
    return `${basePath}?${u.toString()}`;
  };

  return (
    <nav
      aria-label="Tab navigation"
      className={cn(
        "relative flex items-center gap-1 overflow-x-auto border-b border-border",
        className,
      )}
    >
      {tabs.map((t) => {
        const isActive = t.value === active;
        const Icon = t.icon;
        return (
          <Link
            key={t.value}
            href={buildHref(t.value)}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
              "after:absolute after:left-2 after:right-2 after:-bottom-px after:h-[2px] after:rounded-full after:transition-all",
              isActive
                ? "text-foreground after:bg-brand"
                : "text-muted-foreground hover:text-foreground after:bg-transparent",
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  isActive ? "text-brand" : "text-muted-foreground/70",
                )}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
            )}
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  isActive
                    ? "bg-brand text-brand-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {t.badge > 99 ? "99+" : t.badge}
              </span>
            )}
            {t.dot && t.badge === undefined && (
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  isActive ? "bg-brand" : "bg-muted-foreground/40",
                )}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
