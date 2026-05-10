import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  /** show top header (title + subtitle) */
  withHeader?: boolean;
  /** number of stat cards to render in a row at the top, 0 = none */
  stats?: number;
  /** number of list-row skeletons to render */
  rows?: number;
  /** layout variant */
  variant?: "list" | "table" | "form";
};

/**
 * Generic page-loading skeleton — composable variant for routes that don't
 * need a fully bespoke loading.tsx.
 */
export function PageLoading({
  withHeader = true,
  stats = 0,
  rows = 6,
  variant = "list",
}: Props) {
  return (
    <div className="px-4 sm:px-8 py-6 max-w-[1400px] mx-auto w-full space-y-6">
      {withHeader && (
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}

      {stats > 0 && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(stats, 4)}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: stats }).map((_, i) => (
            <div
              key={i}
              className="card-elevated rounded-2xl p-5 flex flex-col gap-3 min-h-[120px]"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-24 mt-auto" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}

      {variant === "table" && (
        <div className="card-elevated rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="card-elevated rounded-2xl p-4 flex items-center gap-4"
            >
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {variant === "form" && (
        <div className="card-elevated rounded-2xl p-6 space-y-5 max-w-2xl">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-10 w-32 rounded-lg mt-2" />
        </div>
      )}
    </div>
  );
}
