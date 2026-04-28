import Link from "next/link";
import {
  Users,
  CalendarDays,
  Banknote,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Sparkles,
  Check,
  Clock,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();

  // Active students count.
  const { count: activeStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("status", "active");

  // Upcoming lessons (next 5 from now).
  const { data: upcoming } = await supabase
    .from("lessons")
    .select("id, scheduled_at, duration_minutes, status, students(full_name)")
    .is("deleted_at", null)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5);

  // Lessons this week (Mon-Sun).
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = Monday
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - day);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const { count: weekLessons } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("scheduled_at", weekStart.toISOString())
    .lt("scheduled_at", weekEnd.toISOString());
  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  const firstName = profile.full_name?.split(" ")[0] ?? "profesore";

  // Trial countdown.
  const trialEnd = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const daysLeft = trialEnd
    ? Math.max(
        0,
        Math.ceil(
          (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 14;
  const trialProgress = Math.min(100, Math.max(0, ((14 - daysLeft) / 14) * 100));

  // Today.
  const today = new Date();
  const dayName = today.toLocaleDateString("sr-Latn-RS", { weekday: "long" });
  const dayNum = today.getDate();
  const monthName = today.toLocaleDateString("sr-Latn-RS", { month: "long" });

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* Decorative gradient + grid (theme-aware) */}
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,var(--secondary)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_0%_100%,var(--secondary)_0%,transparent_50%)]"
        />
        <div
          className="absolute inset-0 opacity-[0.5] pointer-events-none bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_50%,black_30%,transparent_80%)]"
        />

        <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 p-6 sm:p-8">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {dayName}, {dayNum}. {monthName}
              </p>
              <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">
                Dobar dan, {firstName}.
              </h1>
              <p className="text-sm text-muted-foreground">
                Spremno je za nedelju koja dolazi.
              </p>
            </div>

            {/* Trial countdown */}
            <div className="max-w-sm space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Clock className="size-3" strokeWidth={2} />
                  Probni period
                </span>
                <span className="font-medium tabular-nums">
                  {daysLeft} {daysLeft === 1 ? "dan" : "dana"} preostalo
                </span>
              </div>
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-foreground transition-all"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Plan: <span className="font-medium text-foreground">{org?.subscription_tier}</span>
                {" · "}
                <Link href="/settings" className="underline underline-offset-2">
                  Nadogradi
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/students/new" className={buttonVariants({ size: "sm" })}>
                <Plus className="size-3.5" strokeWidth={2} />
                Dodaj učenika
              </Link>
              <Link
                href="/schedule"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                Otvori raspored
              </Link>
            </div>
          </div>

          {/* Date block */}
          <div className="hidden lg:flex flex-col items-end justify-between text-right">
            <div className="rounded-xl border border-border bg-background/60 backdrop-blur-sm p-4 w-32">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Danas
              </p>
              <p className="text-5xl font-medium tracking-tight tabular-nums mt-1">
                {String(dayNum).padStart(2, "0")}
              </p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {monthName}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {org?.name}
            </p>
          </div>
        </div>
      </section>

      {/* Stats — bento with one large + three small */}
      <section className="grid gap-3 lg:grid-cols-4">
        <BigStat
          label="Aktivni učenici"
          value={String(activeStudents ?? 0)}
          icon={Users}
          href="/students"
          trend={
            activeStudents && activeStudents > 0
              ? `${activeStudents} ${activeStudents === 1 ? "učenik" : activeStudents < 5 ? "učenika" : "učenika"}`
              : "Nema učenika"
          }
          className="lg:col-span-2 lg:row-span-2"
        />
        <Stat
          label="Ovonedeljnih časova"
          value={String(weekLessons ?? 0)}
          icon={CalendarDays}
        />
        <Stat label="Opomene 30d" value="0" icon={AlertCircle} />
        <Stat
          label="Ukupan dug"
          value="0"
          unit="RSD"
          icon={Banknote}
          className="lg:col-span-2"
        />
      </section>

      {/* Bottom row */}
      <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <NextStepsCard />
        <UpcomingCard
          lessons={
            (upcoming as
              | {
                  id: string;
                  scheduled_at: string;
                  duration_minutes: number;
                  status: string;
                  students: { full_name: string } | null;
                }[]
              | null) ?? []
          }
        />
      </section>
    </div>
  );
}

/* ---------- big stat (with sparkline placeholder) ---------- */
function BigStat({
  label,
  value,
  icon: Icon,
  href,
  trend,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  href: string;
  trend?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[180px] transition-colors hover:bg-secondary/30",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-3.5" strokeWidth={1.75} />
          <span className="text-xs">{label}</span>
        </div>
        <ArrowUpRight
          className="size-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors"
          strokeWidth={1.75}
        />
      </div>
      <div className="space-y-2 mt-auto">
        <div className="text-5xl font-medium tracking-tight tabular-nums">
          {value}
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <TrendingUp className="size-3" strokeWidth={2} />
            {trend}
          </p>
        )}
      </div>
      {/* Sparkline placeholder */}
      <SparklinePlaceholder className="absolute inset-x-5 bottom-16 lg:bottom-20 h-12 opacity-50" />
    </Link>
  );
}

/* ---------- compact stat ---------- */
function Stat({
  label,
  value,
  unit,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.75} />
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-medium tracking-tight tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}

/* ---------- sparkline placeholder ---------- */
function SparklinePlaceholder({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 40"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.06" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        y1="30"
        x2="200"
        y2="30"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
    </svg>
  );
}

/* ---------- next steps card ---------- */
function NextStepsCard() {
  const steps = [
    {
      href: "/students/new",
      title: "Dodaj prvog učenika",
      description: "Ime, razred i cena po času.",
      icon: Users,
      done: false,
    },
    {
      href: "/schedule",
      title: "Zakaži prvi čas",
      description: "Pojedinačni termin ili ponavljajući slot.",
      icon: CalendarDays,
      done: false,
    },
    {
      href: "/profile",
      title: "Aktiviraj javni profil",
      description: "Roditelji ti šalju upite preko forme.",
      icon: Sparkles,
      done: false,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-medium">Postavi platformu</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doneCount} od {steps.length} završeno
          </p>
        </div>
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 w-6 rounded-full",
                i < doneCount ? "bg-foreground" : "bg-secondary",
              )}
            />
          ))}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className="group flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 transition-colors"
              >
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border shrink-0 transition-colors",
                    step.done
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {step.done ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                <ArrowRight
                  className="size-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                  strokeWidth={1.75}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- upcoming card ---------- */
function UpcomingCard({
  lessons,
}: {
  lessons: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    students: { full_name: string } | null;
  }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium">Sledeći časovi</h2>
        <Link
          href="/schedule"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Otvori
          <ArrowRight className="size-3" strokeWidth={1.75} />
        </Link>
      </div>
      {lessons.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <CalendarDays className="size-4" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-medium mt-3">Raspored je prazan</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
            Kad zakažeš prvi čas, on će se pojaviti ovde.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {lessons.map((l) => {
            const dt = new Date(l.scheduled_at);
            const dateLabel = dt.toLocaleDateString("sr-Latn-RS", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const timeLabel = dt.toLocaleTimeString("sr-Latn-RS", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <li key={l.id} className="px-5 py-3 flex items-center gap-3">
                <div className="text-xs tabular-nums text-muted-foreground w-20 shrink-0">
                  <div>{dateLabel}</div>
                  <div className="text-foreground font-medium">{timeLabel}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {l.students?.full_name ?? "Učenik"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {l.duration_minutes} min
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
