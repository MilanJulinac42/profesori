import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tile =
  | "cyan"
  | "magenta"
  | "rose"
  | "amber"
  | "emerald"
  | "violet"
  | "sky";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tile = "cyan",
  size = "default",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Render any node — typically a primary action button or Link */
  action?: React.ReactNode;
  /** Color tile for the icon background */
  tile?: Tile;
  /** "compact" for inline empty states inside narrow cards */
  size?: "default" | "compact";
  className?: string;
}) {
  const isCompact = size === "compact";
  const tileClass = `tile-${tile}`;

  return (
    <div
      className={cn(
        "card-elevated rounded-2xl flex flex-col items-center text-center mx-auto",
        isCompact ? "px-6 py-10 max-w-sm" : "px-8 py-14 max-w-md",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl shadow-[0_1px_0_oklch(1_0_0/0.6)_inset]",
          tileClass,
          isCompact ? "size-11" : "size-14",
        )}
      >
        <Icon
          className={isCompact ? "size-5" : "size-6"}
          strokeWidth={1.75}
        />
      </div>
      <h3
        className={cn(
          "font-semibold tracking-tight text-foreground mt-5",
          isCompact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-1.5 leading-relaxed max-w-sm",
            isCompact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
