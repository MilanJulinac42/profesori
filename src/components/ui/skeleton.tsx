import { cn } from "@/lib/utils";

/**
 * Animated shimmer placeholder. Compose to build page-level loading skeletons.
 *
 *   <Skeleton className="h-8 w-32" />
 *   <Skeleton className="h-32 w-full rounded-xl" />
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/60 dark:bg-muted/40",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.06] before:to-transparent",
        "before:animate-[shimmer_1.6s_infinite]",
        className,
      )}
      {...props}
    />
  );
}
