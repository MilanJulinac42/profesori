import { TrendingUp, Star, CalendarDays, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stylized "dashboard preview" — layered floating cards showing fake
 * product UI: stat card, mini calendar, activity heatmap, students list.
 * Pure visual, no real data. Used on the auth split layout to give
 * a sense of what the product looks like.
 */
export function AuthPreview() {
  return (
    <div
      aria-hidden
      className="relative w-full max-w-md mx-auto select-none pointer-events-none"
      style={{ perspective: "1200px" }}
    >
      {/* Glow backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -m-8 rounded-[40px] blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 30% 30%, oklch(0.78 0.16 205 / 0.4), transparent 70%), radial-gradient(ellipse 60% 60% at 80% 80%, oklch(0.7 0.27 340 / 0.3), transparent 70%)",
        }}
      />

      <div
        className="relative space-y-3"
        style={{ transform: "rotateX(8deg) rotateY(-6deg) rotateZ(-1deg)" }}
      >
        {/* Big stat card */}
        <PreviewCard className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                Časova ovog meseca
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span
                  className="font-display text-3xl text-foreground tabular-nums leading-none bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--chart-1) 0%, var(--chart-2) 70%, var(--chart-3) 100%)",
                  }}
                >
                  42
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  održano
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-md tile-emerald px-1.5 py-0.5 text-[10px] font-bold">
              <TrendingUp className="size-2.5" strokeWidth={2.5} />
              +8
            </span>
          </div>
          {/* Mini sparkline */}
          <svg
            viewBox="0 0 200 40"
            className="w-full h-9"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(0.78 0.16 205)"
                  stopOpacity="0.5"
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.78 0.16 205)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path
              d="M 0 28 L 20 22 L 40 25 L 60 18 L 80 20 L 100 14 L 120 16 L 140 10 L 160 12 L 180 6 L 200 8 L 200 40 L 0 40 Z"
              fill="url(#sparkGrad)"
            />
            <path
              d="M 0 28 L 20 22 L 40 25 L 60 18 L 80 20 L 100 14 L 120 16 L 140 10 L 160 12 L 180 6 L 200 8"
              fill="none"
              stroke="oklch(0.78 0.16 205)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums mt-1">
            <span>14 aktivnih učenika</span>
            <span>Prosečna ocena 4.7 ★</span>
          </div>
        </PreviewCard>

        {/* Two-card row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Mini calendar */}
          <PreviewCard className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex size-5 items-center justify-center rounded-md tile-violet shrink-0">
                <CalendarDays className="size-2.5" strokeWidth={2.5} />
              </div>
              <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                Danas
              </p>
            </div>
            <div className="space-y-1">
              <CalSlot time="14:00" name="Marko" tile="cyan" />
              <CalSlot time="16:30" name="Ana" tile="violet" />
              <CalSlot time="18:00" name="Stefan" tile="emerald" current />
              <CalSlot time="19:30" name="Lana" tile="amber" />
            </div>
          </PreviewCard>

          {/* Mini heatmap */}
          <PreviewCard className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex size-5 items-center justify-center rounded-md tile-cyan shrink-0">
                <TrendingUp className="size-2.5" strokeWidth={2.5} />
              </div>
              <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                Aktivnost
              </p>
            </div>
            <MiniHeatmap />
            <p className="text-[9px] text-muted-foreground/70 mt-1.5">
              30 dana
            </p>
          </PreviewCard>
        </div>

        {/* Students list */}
        <PreviewCard className="p-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Najaktivniji učenici
            </p>
            <span className="text-[9px] text-muted-foreground tabular-nums">
              ovaj mesec
            </span>
          </div>
          <ul className="space-y-1.5">
            <StudentRow
              initials="MP"
              name="Marko Petrović"
              detail="8 časova"
              rating={5}
              gradient={["oklch(0.78 0.16 205)", "oklch(0.65 0.22 240)"]}
            />
            <StudentRow
              initials="AJ"
              name="Ana Jovanović"
              detail="6 časova"
              rating={5}
              gradient={["oklch(0.7 0.27 340)", "oklch(0.62 0.25 285)"]}
            />
            <StudentRow
              initials="SK"
              name="Stefan Kostić"
              detail="5 časova"
              rating={4}
              gradient={["oklch(0.7 0.2 150)", "oklch(0.72 0.18 195)"]}
            />
          </ul>
        </PreviewCard>

      </div>
    </div>
  );
}

function PreviewCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/90 backdrop-blur-md shadow-[0_24px_64px_-16px_oklch(0_0_0/0.5),0_0_0_1px_oklch(1_0_0/0.04)_inset]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CalSlot({
  time,
  name,
  tile,
  current,
}: {
  time: string;
  name: string;
  tile: "cyan" | "violet" | "emerald" | "amber";
  current?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px]",
        current ? `tile-${tile}` : "bg-secondary/50",
      )}
    >
      <span className="font-semibold tabular-nums shrink-0">{time}</span>
      <span className="truncate">{name}</span>
    </div>
  );
}

function MiniHeatmap() {
  // 5 rows × 7 cols of cells with random-ish intensities
  const pattern = [
    [1, 0, 2, 1, 3, 2, 1],
    [0, 2, 1, 3, 2, 1, 0],
    [1, 2, 3, 4, 3, 1, 2],
    [2, 1, 3, 2, 4, 2, 1],
    [0, 1, 2, 1, 3, 2, 1],
  ];
  const colors = [
    "bg-secondary/40",
    "bg-[oklch(0.7_0.18_205/0.32)]",
    "bg-[oklch(0.72_0.2_205/0.55)]",
    "bg-[oklch(0.74_0.22_205/0.8)]",
    "bg-[oklch(0.78_0.24_205)]",
  ];
  return (
    <div className="flex gap-0.5">
      {pattern[0]!.map((_, col) => (
        <div key={col} className="flex flex-col gap-0.5 flex-1">
          {pattern.map((row, ri) => (
            <div
              key={ri}
              className={cn("aspect-square rounded-[2px]", colors[row[col]!])}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StudentRow({
  initials,
  name,
  detail,
  rating,
  gradient,
}: {
  initials: string;
  name: string;
  detail: string;
  rating: number;
  gradient: [string, string];
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="inline-flex size-6 items-center justify-center rounded-full text-[9px] font-semibold text-white shrink-0"
        style={{
          backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        }}
      >
        {initials}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-foreground truncate font-medium leading-tight">
          {name}
        </p>
        <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 tabular-nums">
          {detail}
        </p>
      </div>
      <span className="flex gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              "size-2",
              n <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/25",
            )}
            strokeWidth={1.5}
          />
        ))}
      </span>
    </li>
  );
}
