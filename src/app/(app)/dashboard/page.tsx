import Link from "next/link";
import {
  Users,
  CalendarDays,
  ArrowRight,
  Plus,
  Sparkles,
  Check,
  Clock,
} from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getLessonAnalytics,
  getRangeForPeriod,
  type AnalyticsPeriod,
} from "@/lib/analytics/queries";
import { getOrgDebtors } from "@/lib/payments/queries";
import { formatRsd } from "@/lib/money";
import { AnalyticsSection } from "./_components/analytics-section";

type Search = { period?: string };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const params = await searchParams;
  const period: AnalyticsPeriod = (
    ["week", "month", "30d", "all"].includes(params.period ?? "")
      ? params.period
      : "month"
  ) as AnalyticsPeriod;

  // Concurrent queries.
  const range = getRangeForPeriod(period);
  const [
    { count: activeStudents },
    { data: upcoming },
    analytics,
    debtors,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "active"),
    supabase
      .from("lessons")
      .select("id, scheduled_at, duration_minutes, status, students(full_name)")
      .is("deleted_at", null)
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
    getLessonAnalytics(supabase, range),
    getOrgDebtors(supabase),
  ]);

  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;
  const firstName = profile.full_name?.split(" ")[0] ?? "profesore";

  // Trial countdown.
  const trialEnd = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const daysLeft = trialEnd
    ? Math.max(
        0,
        Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 14;
  const trialProgress = Math.min(100, Math.max(0, ((14 - daysLeft) / 14) * 100));

  // Today.
  const today = new Date();
  const dayName = today.toLocaleDateString("sr-Latn-RS", { weekday: "long" });
  const dayNum = today.getDate();
  const monthName = today.toLocaleDateString("sr-Latn-RS", { month: "long" });

  // Show onboarding only if user has no students and no lessons.
  const showOnboarding = (activeStudents ?? 0) === 0;

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
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
                {(activeStudents ?? 0) > 0
                  ? `${activeStudents} ${activeStudents === 1 ? "aktivan učenik" : "aktivnih učenika"} · ${analytics.scheduled} predstojećih časova u periodu`
                  : "Spremno je za nedelju koja dolazi."}
              </p>
            </div>

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
                Plan:{" "}
                <span className="font-medium text-foreground">
                  {org?.subscription_tier}
                </span>
                {" · "}
                <Link href="/settings" className="underline underline-offset-2">
                  Nadogradi
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/students/new"
                className={buttonVariants({ size: "sm" })}
              >
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
            <p className="text-xs text-muted-foreground mt-4">{org?.name}</p>
          </div>
        </div>
      </section>

      {/* Debt callout (only visible if any) */}
      {debtors.totalDebt > 0 && <DebtCallout debtors={debtors} />}

      {/* Analytics */}
      <AnalyticsSection stats={analytics} period={period} />

      {/* Bottom row: onboarding (only when not done) + upcoming */}
      <section
        className={cn(
          "grid gap-3",
          showOnboarding ? "lg:grid-cols-[1.4fr_1fr]" : "lg:grid-cols-1",
        )}
      >
        {showOnboarding && <NextStepsCard />}
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

/* ---------- debt callout ---------- */
function DebtCallout({
  debtors,
}: {
  debtors: Awaited<ReturnType<typeof getOrgDebtors>>;
}) {
  const top = debtors.debtors.slice(0, 3);
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Naplata
          </p>
          <p className="text-2xl font-medium tracking-tight tabular-nums mt-1">
            {formatRsd(debtors.totalDebt)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {debtors.debtors.length}{" "}
            {debtors.debtors.length === 1
              ? "učenik duguje"
              : "učenika duguju"}
          </p>
        </div>
        <Link
          href="/billing"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Otvori naplatu
          <ArrowRight className="size-3" strokeWidth={1.75} />
        </Link>
      </div>
      <ul className="grid sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
        {top.map((d) => (
          <li key={d.student_id}>
            <Link
              href={`/students/${d.student_id}`}
              className="flex items-center justify-between gap-2 rounded-md hover:bg-secondary/40 px-2 py-1.5 transition-colors"
            >
              <span className="text-xs truncate">{d.full_name}</span>
              <span className="text-xs font-medium tabular-nums">
                {formatRsd(d.debt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
          Otvori raspored
          <ArrowRight className="size-3" strokeWidth={1.75} />
        </Link>
      </div>
      {lessons.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <CalendarDays className="size-4" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-medium mt-3">Nema zakazanih časova</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
            Kad zakažeš čas u rasporedu, pojaviće se ovde.
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

