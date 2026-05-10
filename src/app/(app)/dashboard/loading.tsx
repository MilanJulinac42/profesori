import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="px-4 sm:px-8 py-6 max-w-[1400px] mx-auto w-full space-y-6">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden rounded-3xl bg-card-elevated border border-border/60 px-6 sm:px-10 py-8 sm:py-10">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-4 w-56" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-16 w-72 rounded-lg" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-3 lg:pl-6 lg:border-l lg:border-border/40">
            <Skeleton className="h-7 w-44 rounded-full ml-auto" />
            <div className="grid grid-cols-7 gap-1.5 mt-4">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-[5px]" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* StatCards skeleton */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="card-elevated rounded-2xl p-5 flex flex-col gap-3 min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-28 mt-auto" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8 card-elevated rounded-2xl p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 card-elevated rounded-2xl p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="size-44 rounded-full mx-auto" />
        </div>
      </div>

      {/* Lists skeleton */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-5">
          <div className="card-elevated rounded-2xl p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="size-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 card-elevated rounded-2xl p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
