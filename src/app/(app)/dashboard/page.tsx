import Link from "next/link";
import {
  Users,
  CalendarDays,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Sparkles,
  Check,
  Clock,
  Banknote,
  StickyNote,
  ClipboardCheck,
  Mic,
  Wallet,
  CalendarCheck,
  XCircle,
  TrendingDown,
  Trophy,
} from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  getLessonAnalytics,
  getRangeForPeriod,
  pctDelta,
  PERIOD_LABELS,
  PERIOD_OPTIONS,
  type Analytics,
  type AnalyticsPeriod,
} from "@/lib/analytics/queries";
import { getOrgDebtors } from "@/lib/payments/queries";
import { computeBillableStatuses } from "@/lib/payments/types";
import {
  countLessonsMissingNotes,
  getOldestLessonNeedingNotes,
  type LessonNeedingNote,
} from "@/lib/lessons/queries";
import { getOwnPublicProfile } from "@/lib/public-profile/queries";
import { getOrgSettings } from "@/lib/settings/queries";
import {
  computeProfileCompleteness,
  getRecentActivity,
  getRecentNewBookings,
} from "@/lib/dashboard/queries";
import { formatRsd } from "@/lib/money";
import {
  countSubmittedHomework,
  listSubmittedHomework,
} from "@/lib/homework/queries";
import { ProfileWidget } from "./_components/profile-widget";
import { BookingsPreview } from "./_components/bookings-preview";
import { RecentActivity } from "./_components/recent-activity";
import { NextStepsCard } from "./_components/next-steps-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { RevenueAreaChart } from "@/components/dashboard/revenue-area-chart";
import {
  StatusDonut,
  type DonutSlice,
} from "@/components/dashboard/status-donut";
import { TrendBadge } from "@/components/dashboard/trend-badge";
import { MountFade, CountUp } from "@/components/dashboard/motion";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { EmptyState } from "@/components/empty-state";

type Search = { period?: string };

type UpcomingLesson = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  students: { full_name: string } | null;
};

type SubmittedHomework = {
  id: string;
  title: string;
  student_name: string;
  submitted_at: string | null;
  student_id: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { profile, authUser } = await requireUser();
  const supabase = await createClient();

  const params = await searchParams;
  const period: AnalyticsPeriod = (
    ["week", "month", "all"].includes(params.period ?? "")
      ? params.period
      : "month"
  ) as AnalyticsPeriod;

  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  const settings = await getOrgSettings(supabase, org!.id);
  const billableStatuses = computeBillableStatuses(settings);

  const range = getRangeForPeriod(period);
  const [
    { count: activeStudents },
    { data: upcoming },
    analytics,
    debtors,
    missingNotesCount,
    publicProfile,
    recentBookings,
    recentActivity,
    submittedHomeworkCount,
    submittedHomework,
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
    getLessonAnalytics(supabase, range, { period }),
    getOrgDebtors(supabase, billableStatuses),
    countLessonsMissingNotes(supabase),
    getOwnPublicProfile(supabase, org!.id),
    getRecentNewBookings(supabase, 4),
    getRecentActivity(supabase, 12),
    countSubmittedHomework(supabase),
    listSubmittedHomework(supabase, 3),
  ]);

  // Onboarding state — koraci za "Postavi platformu" karticu
  const [{ count: anyLessonsCount }, { count: googleConnCount }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .limit(1),
      supabase
        .from("google_connections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .limit(1),
    ]);
  const hasStudents = (activeStudents ?? 0) > 0;
  const hasLessons = (anyLessonsCount ?? 0) > 0;
  const googleConnected = (googleConnCount ?? 0) > 0;
  const allOnboardingDone = hasStudents && hasLessons && googleConnected;
  const setupDismissed = !!profile.dashboard_setup_dismissed_at;

  const oldestNeedingNotes = await getOldestLessonNeedingNotes(supabase);

  const completeness = computeProfileCompleteness(publicProfile);

  const trialEnd = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const daysLeft = trialEnd
    ? Math.max(
        0,
        Math.ceil(
          // eslint-disable-next-line react-hooks/purity
          (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 14;

  const today = new Date();
  const dayName = today.toLocaleDateString("sr-Latn-RS", { weekday: "long" });
  const dayNum = today.getDate();
  const monthName = today.toLocaleDateString("sr-Latn-RS", { month: "long" });

  const upcomingLessons = (upcoming as UpcomingLesson[] | null) ?? [];
  const showOnboarding = !allOnboardingDone && !setupDismissed;
  const profileNeedsAttention =
    !publicProfile?.published || completeness.score < 80;

  const pendingItems = buildPendingItems({
    debtors,
    missingNotesCount,
    oldestNeedingNotes,
    submittedHomeworkCount,
    submittedHomework,
  });

  return (
    <div className="px-4 sm:px-8 py-6 max-w-[1400px] mx-auto w-full space-y-6">
      <MountFade>
        <DashboardHero
          dayName={dayName}
          dayNum={dayNum}
          monthName={monthName}
          activeStudents={activeStudents ?? 0}
          analytics={analytics}
          period={period}
          daysLeft={daysLeft}
          trialTier={org?.subscription_tier ?? "start"}
        />
      </MountFade>

      {showOnboarding && (
        <MountFade delay={0.05}>
          <NextStepsCard
            hasStudents={hasStudents}
            hasLessons={hasLessons}
            googleConnected={googleConnected}
          />
        </MountFade>
      )}

      {recentBookings.length > 0 && (
        <MountFade delay={0.1}>
          <BookingsPreview bookings={recentBookings} />
        </MountFade>
      )}

      <MountFade delay={0.1}>
        <StatRow analytics={analytics} period={period} />
      </MountFade>

      <MountFade delay={0.18}>
        <div className="grid gap-5 lg:grid-cols-12">
          <ChartCard
            title="Trend prihoda"
            subtitle={PERIOD_LABELS[period].toLowerCase()}
            className="lg:col-span-8 card-glow"
            contentMinHeight={280}
            action={
              analytics.previous && (
                <TrendBadge
                  delta={pctDelta(
                    analytics.revenue,
                    analytics.previous.revenue,
                  )}
                  size="md"
                />
              )
            }
          >
            {analytics.series && analytics.series.length > 1 ? (
              <RevenueAreaChart
                data={analytics.series.map((s) => ({
                  label: s.label,
                  value: s.revenue,
                }))}
                height={260}
              />
            ) : (
              <EmptyState
                icon={TrendingDown}
                tile="cyan"
                size="compact"
                title="Nema dovoljno podataka"
                description="Trend će se pojaviti kad imaš održanih časova kroz period."
              />
            )}
          </ChartCard>

          <ChartCard
            title="Otkazivanja po razlogu"
            subtitle={`${analytics.totalCancelled} ukupno`}
            className="lg:col-span-4 card-glow"
            contentMinHeight={280}
          >
            {analytics.totalCancelled > 0 ? (
              <StatusDonut
                data={cancellationSlices(analytics)}
                centerLabel="Otkazano"
                centerValue={String(analytics.totalCancelled)}
                size={170}
              />
            ) : (
              <EmptyState
                icon={Check}
                tile="emerald"
                size="compact"
                title="Sve čisto"
                description="Nema otkazivanja u periodu."
              />
            )}
          </ChartCard>
        </div>
      </MountFade>

      <MountFade delay={0.26}>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-5 min-w-0">
            {pendingItems.length > 0 ? (
              <PendingWork items={pendingItems} />
            ) : (
              <AllClearCard />
            )}
            <UpcomingCard lessons={upcomingLessons} />
            <RecentActivity events={recentActivity} />
          </div>

          <aside className="lg:col-span-4 space-y-5 min-w-0">
            <TopStudentsCard students={analytics.topStudents} />
            {profileNeedsAttention && (
              <ProfileWidget
                slug={publicProfile?.slug ?? org?.slug ?? "tvoj-link"}
                published={publicProfile?.published ?? false}
                availableForNewStudents={
                  publicProfile?.available_for_new_students ?? true
                }
                completeness={completeness}
              />
            )}
          </aside>
        </div>
      </MountFade>
    </div>
  );
}

/* ---------- HERO ---------- */
function DashboardHero({
  dayName,
  dayNum,
  monthName,
  activeStudents,
  analytics,
  period,
  daysLeft,
  trialTier,
}: {
  dayName: string;
  dayNum: number;
  monthName: string;
  activeStudents: number;
  analytics: Analytics;
  period: AnalyticsPeriod;
  daysLeft: number;
  trialTier: string;
}) {
  const hasData = (analytics.series ?? []).length > 0;
  const isEmpty = activeStudents === 0;

  if (isEmpty) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-hero-mesh border border-border/60 dark:border-white/[0.08]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/15"
        />
        <div className="relative px-6 sm:px-10 py-10 sm:py-14">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              <span
                aria-hidden
                className="relative inline-block size-2 rounded-full bg-success pulse-dot"
              />
              {dayName}, {dayNum}. {monthName}
            </span>
            {daysLeft <= 7 && (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 rounded-full bg-card/70 backdrop-blur-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-card transition-colors"
              >
                <Clock className="size-3 text-brand" strokeWidth={2.25} />
                <span className="text-foreground">
                  {daysLeft}d probnog · {trialTier}
                </span>
                <ArrowUpRight
                  className="size-3 text-muted-foreground"
                  strokeWidth={2}
                />
              </Link>
            )}
          </div>

          <h1 className="font-display mt-4 text-[2rem] sm:text-[2.5rem] leading-[1.05] text-foreground max-w-2xl">
            Dobrodošao na <em className="not-italic text-brand">Profesori.</em>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl inline-flex items-center gap-1.5">
            Postavi prve stvari ispod — gotovo si za par minuta.
            <ArrowRight className="size-4 rotate-90" strokeWidth={2} />
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-hero-mesh border border-border/60 dark:border-white/[0.08]">
      {/* Soft top highlight + bottom shadow for premium depth */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/15"
      />

      <div className="relative px-6 sm:px-10 py-8 sm:py-10 grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: greeting, big number, CTAs */}
        <div className="lg:col-span-7 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              <span
                aria-hidden
                className="relative inline-block size-2 rounded-full bg-success pulse-dot"
              />
              {dayName}, {dayNum}. {monthName}
            </span>
            {daysLeft <= 7 && (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 rounded-full bg-card/70 backdrop-blur-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-card transition-colors"
              >
                <Clock className="size-3 text-brand" strokeWidth={2.25} />
                <span className="text-foreground">
                  {daysLeft}d probnog · {trialTier}
                </span>
                <ArrowUpRight
                  className="size-3 text-muted-foreground"
                  strokeWidth={2}
                />
              </Link>
            )}
          </div>

          <h1 className="font-display mt-4 text-[2rem] sm:text-[2.5rem] leading-[1.05] text-foreground">
            Dobar dan.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {`${activeStudents} ${activeStudents === 1 ? "aktivan učenik" : "aktivnih učenika"} · ${analytics.scheduled} predstojećih u periodu`}
          </p>

          {/* The big number — gradient text fill */}
          <div className="mt-7">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-2">
              Zarađeno · {PERIOD_LABELS[period].toLowerCase()}
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className="font-display text-5xl sm:text-7xl leading-none tabular-nums bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--chart-1) 0%, var(--chart-2) 60%, var(--chart-3) 100%)",
                }}
              >
                <CountUp
                  value={analytics.revenue}
                  format="rsd"
                  duration={1.3}
                />
              </span>
              <span className="text-base sm:text-xl text-muted-foreground font-semibold">
                RSD
              </span>
              {analytics.previous && (
                <TrendBadge
                  delta={pctDelta(
                    analytics.revenue,
                    analytics.previous.revenue,
                  )}
                  size="md"
                  className="self-center"
                />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
              {analytics.held > 0
                ? `~${formatRsd(analytics.averageRevenuePerHeld, false)} po času · ${analytics.held} ${analytics.held === 1 ? "čas" : "časova"} održano`
                : `Nema održanih časova · ${PERIOD_LABELS[period].toLowerCase()}`}
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href="/students/new"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Novi učenik
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-card/70 backdrop-blur-md border border-border text-sm font-medium hover:bg-card transition-colors"
            >
              <CalendarDays className="size-3.5" strokeWidth={1.75} />
              Raspored
            </Link>
            <Link
              href="/exercises/new"
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-card/70 backdrop-blur-md border border-border text-sm font-medium hover:bg-card transition-colors"
            >
              <Sparkles className="size-3.5" strokeWidth={1.75} />
              Zadaci
            </Link>
          </div>
        </div>

        {/* RIGHT: heatmap + period selector */}
        <div className="lg:col-span-5 min-w-0 lg:pl-6 lg:border-l lg:border-border/40">
          <div className="flex justify-end mb-4">
            <HeroPeriodSelector active={period} />
          </div>
          {hasData ? (
            <ActivityHeatmap
              days={analytics.series ?? []}
              period={period}
              granularity={analytics.seriesGranularity ?? "daily"}
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              tile="cyan"
              size="compact"
              title="Heatmap aktivnosti"
              description="Pojaviće se kad budeš imao časove kroz period."
            />
          )}
        </div>
      </div>
    </section>
  );
}

function HeroPeriodSelector({ active }: { active: AnalyticsPeriod }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-card/70 backdrop-blur-md border border-border p-0.5 text-[11px]">
      {PERIOD_OPTIONS.map((p) => {
        const isActive = active === p;
        const href = p === "month" ? "/dashboard" : `/dashboard?period=${p}`;
        return (
          <Link
            key={p}
            href={href}
            scroll={false}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              isActive
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PERIOD_LABELS[p].replace("Poslednjih ", "")}
          </Link>
        );
      })}
    </div>
  );
}

/* ---------- STAT ROW ---------- */
function StatRow({
  analytics,
  period,
}: {
  analytics: Analytics;
  period: AnalyticsPeriod;
}) {
  const prev = analytics.previous;
  const sparkData = (analytics.series ?? []).map((s) => s.revenue / 100);
  const heldSpark = (analytics.series ?? []).map((s) => s.held);

  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Zarađeno"
        value={<CountUp value={analytics.revenue} format="rsd" />}
        unit="RSD"
        icon={Wallet}
        tile="cyan"
        delta={prev ? pctDelta(analytics.revenue, prev.revenue) : undefined}
        spark={
          sparkData.length > 1
            ? { data: sparkData, color: "var(--chart-1)" }
            : undefined
        }
        hint={
          analytics.held > 0
            ? `~${formatRsd(analytics.averageRevenuePerHeld, false)} po času`
            : "Nema održanih"
        }
      />
      <StatCard
        label="Časova održano"
        value={<CountUp value={analytics.held} />}
        icon={CalendarCheck}
        tile="violet"
        delta={prev ? pctDelta(analytics.held, prev.held) : undefined}
        spark={
          heldSpark.length > 1
            ? { data: heldSpark, color: "var(--chart-5)" }
            : undefined
        }
        hint={
          analytics.scheduled > 0
            ? `${analytics.scheduled} predstojećih`
            : "—"
        }
      />
      <StatCard
        label="Otkazivanja"
        value={<CountUp value={analytics.totalCancelled} />}
        icon={XCircle}
        tile="rose"
        delta={
          prev
            ? pctDelta(analytics.totalCancelled, prev.totalCancelled)
            : undefined
        }
        inverseTrend
        hint={
          analytics.lostRevenue > 0
            ? `${formatRsd(analytics.lostRevenue)} izgubljeno`
            : "bez izgubljenog prihoda"
        }
      />
      <StatCard
        label="Stopa otkazivanja"
        value={
          analytics.totalLessonsTouched > 0 ? (
            <CountUp
              value={analytics.cancellationRate}
              format="percent"
            />
          ) : (
            "—"
          )
        }
        icon={TrendingDown}
        tile="amber"
        delta={
          prev
            ? pctDelta(analytics.cancellationRate, prev.cancellationRate)
            : undefined
        }
        inverseTrend
        hint={
          analytics.totalLessonsTouched > 0
            ? `${analytics.totalCancelled} od ${analytics.totalLessonsTouched}`
            : "nema podataka"
        }
      />
    </div>
  );
}

/* ---------- DONUT slices ---------- */
function cancellationSlices(stats: Analytics): DonutSlice[] {
  return [
    {
      key: "by_student",
      label: "Otkazao učenik",
      value: stats.cancelledByStudent,
      color: "var(--chart-2)",
    },
    {
      key: "by_teacher",
      label: "Otkazao profesor",
      value: stats.cancelledByTeacher,
      color: "var(--chart-3)",
    },
    {
      key: "no_show",
      label: "Nije se pojavio",
      value: stats.noShow,
      color: "var(--destructive)",
    },
  ].filter((s) => s.value > 0);
}

/* ---------- pending work ---------- */
type PendingItem = {
  key: string;
  icon: typeof StickyNote;
  title: string;
  detail?: string;
  href: string;
  cta: string;
  ctaIcon?: typeof StickyNote;
  primary?: boolean;
  tile: "rose" | "amber" | "emerald" | "violet" | "sky" | "cyan" | "magenta";
};

function buildPendingItems({
  debtors,
  missingNotesCount,
  oldestNeedingNotes,
  submittedHomeworkCount,
  submittedHomework,
}: {
  debtors: Awaited<ReturnType<typeof getOrgDebtors>>;
  missingNotesCount: number;
  oldestNeedingNotes: LessonNeedingNote | null;
  submittedHomeworkCount: number;
  submittedHomework: SubmittedHomework[];
}): PendingItem[] {
  const items: PendingItem[] = [];

  if (debtors.totalDebt > 0) {
    const top = debtors.debtors[0];
    items.push({
      key: "debt",
      icon: Banknote,
      title: `${formatRsd(debtors.totalDebt)} duga`,
      detail:
        debtors.debtors.length > 1
          ? `${debtors.debtors.length} učenika · najveći ${top?.full_name}`
          : top?.full_name,
      href: "/billing",
      cta: "Naplati",
      tile: "rose",
      primary: true,
    });
  }

  if (missingNotesCount > 0 && oldestNeedingNotes) {
    const dt = new Date(oldestNeedingNotes.scheduled_at);
    items.push({
      key: "notes",
      icon: StickyNote,
      title: `${missingNotesCount} ${missingNotesCount === 1 ? "čas bez beleške" : "časova bez beleške"}`,
      detail: `${oldestNeedingNotes.student_name} · ${dt.toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "short" })}`,
      href: `/lessons/${oldestNeedingNotes.id}/note`,
      cta: "Snimi belešku",
      ctaIcon: Mic,
      tile: "amber",
    });
  }

  if (submittedHomeworkCount > 0) {
    const top = submittedHomework[0];
    items.push({
      key: "homework",
      icon: ClipboardCheck,
      title: `${submittedHomeworkCount} ${submittedHomeworkCount === 1 ? "domaći" : "domaća"} za pregled`,
      detail: top ? `${top.student_name} · ${top.title}` : undefined,
      href: top ? `/students/${top.student_id}` : "/students",
      cta: "Pregledaj",
      ctaIcon: Check,
      tile: "emerald",
    });
  }

  return items;
}

function PendingWork({ items }: { items: PendingItem[] }) {
  return (
    <section className="card-elevated card-glow rounded-2xl overflow-hidden">
      <header className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
            Akcije danas
          </h2>
          <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground tabular-nums">
            {items.length} {items.length === 1 ? "stavka" : "stavki"}
          </span>
        </div>
      </header>
      <ul className="divide-y divide-border">
        {items.map((item, i) => {
          const Icon = item.icon;
          const CtaIcon = item.ctaIcon;
          const isPrimary = i === 0 && item.primary;
          return (
            <li
              key={item.key}
              className={cn(
                "px-5 py-4 flex items-center gap-4 transition-colors hover:bg-secondary/40",
              )}
            >
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl shrink-0",
                  `tile-${item.tile}`,
                )}
              >
                <Icon className="size-5" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.95rem] font-semibold truncate text-foreground tracking-tight">
                  {item.title}
                </p>
                {item.detail && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.detail}
                  </p>
                )}
              </div>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[0.8rem] font-semibold transition-all shrink-0",
                  isPrimary
                    ? "bg-brand text-brand-foreground hover:opacity-90 glow-brand"
                    : "bg-secondary hover:bg-accent text-foreground border border-border/60",
                )}
              >
                {CtaIcon && <CtaIcon className="size-3.5" strokeWidth={2.25} />}
                {item.cta}
                {!CtaIcon && <ArrowRight className="size-3.5" strokeWidth={2.25} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AllClearCard() {
  return (
    <section className="card-elevated card-glow rounded-2xl px-6 py-7 flex items-center gap-5">
      <div className="flex size-12 items-center justify-center rounded-2xl tile-emerald shrink-0">
        <Check className="size-6" strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-foreground tracking-tight">
          Sve čisto.
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Nema dugova, beleški ni domaćih da te čeka. Otvori raspored ili
          dodaj učenika.
        </p>
      </div>
    </section>
  );
}

/* ---------- TOP STUDENTS — avatar, bar, revenue ---------- */
function TopStudentsCard({
  students,
}: {
  students: Analytics["topStudents"];
}) {
  if (students.length === 0) {
    return (
      <ChartCard title="Najbolji učenici" subtitle="po prihodu">
        <EmptyState
          icon={Trophy}
          tile="amber"
          size="compact"
          title="Još nema podataka"
          description="Najbolji učenici se prikazuju kad bude održanih časova."
        />
      </ChartCard>
    );
  }

  const max = Math.max(...students.map((s) => s.revenue));

  return (
    <ChartCard title="Najbolji učenici" subtitle="po prihodu u periodu">
      <ul className="space-y-3.5">
        {students.map((s, i) => (
          <li key={s.id}>
            <Link
              href={`/students/${s.id}`}
              className="group flex items-center gap-3"
            >
              <span className="text-[11px] tabular-nums text-muted-foreground w-3 text-right">
                {i + 1}
              </span>
              <Avatar name={s.name} index={i} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                    {s.name}
                  </p>
                  <span className="text-xs font-semibold tabular-nums text-foreground shrink-0">
                    {formatRsd(s.revenue)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${max > 0 ? (s.revenue / max) * 100 : 0}%`,
                      background: `var(--chart-${(i % 5) + 1})`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {s.lessons}{" "}
                  {s.lessons === 1
                    ? "čas"
                    : s.lessons < 5
                      ? "časa"
                      : "časova"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

function Avatar({ name, index }: { name: string; index: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const gradients = [
    "linear-gradient(135deg, var(--chart-1), var(--chart-5))",
    "linear-gradient(135deg, var(--chart-2), var(--chart-1))",
    "linear-gradient(135deg, var(--chart-3), var(--chart-2))",
    "linear-gradient(135deg, var(--chart-4), var(--chart-1))",
    "linear-gradient(135deg, var(--chart-5), var(--chart-2))",
  ];
  return (
    <span
      className="flex size-8 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_6px_-2px_rgba(0,0,0,0.4)]"
      style={{ background: gradients[index % gradients.length] }}
    >
      {initials || "?"}
    </span>
  );
}

/* ---------- upcoming card ---------- */
function UpcomingCard({ lessons }: { lessons: UpcomingLesson[] }) {
  return (
    <div className="card-elevated card-glow rounded-2xl overflow-hidden flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
          Sledeći časovi
        </h2>
        <Link
          href="/schedule"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 group"
        >
          Otvori raspored
          <ArrowRight
            className="size-3 group-hover:translate-x-0.5 transition-transform"
            strokeWidth={2}
          />
        </Link>
      </header>
      {lessons.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          tile="violet"
          size="compact"
          title="Nema zakazanih časova"
          description="Kad zakažeš čas u rasporedu, pojaviće se ovde."
        />
      ) : (
        <ul className="divide-y divide-border">
          {lessons.map((l, i) => {
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
              <li key={l.id}>
                <Link
                  href={`/schedule?lesson=${l.id}`}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-secondary/40 transition-colors group"
                >
                  <Avatar name={l.students?.full_name ?? "?"} index={i} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground tracking-tight">
                      {l.students?.full_name ?? "Učenik"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {dateLabel} · {l.duration_minutes} min
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                    {timeLabel}
                  </span>
                  <ArrowRight
                    className="size-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

