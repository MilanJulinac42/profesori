import Link from "next/link";
import {
  Users,
  CalendarDays,
  ArrowRight,
  Plus,
  Sparkles,
  Check,
  Clock,
  Banknote,
  StickyNote,
  ClipboardCheck,
  Mic,
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
import { getAppValueStats } from "@/lib/dashboard/app-value";
import { AppValueWidget } from "./_components/app-value-widget";
import { AnalyticsSection } from "./_components/analytics-section";
import { ProfileWidget } from "./_components/profile-widget";
import { BookingsPreview } from "./_components/bookings-preview";
import { RecentActivity } from "./_components/recent-activity";

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
  const { profile } = await requireUser();
  const supabase = await createClient();

  const params = await searchParams;
  const period: AnalyticsPeriod = (
    ["week", "month", "30d", "all"].includes(params.period ?? "")
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
    appValueStats,
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
    getOrgDebtors(supabase, billableStatuses),
    countLessonsMissingNotes(supabase),
    getOwnPublicProfile(supabase, org!.id),
    getRecentNewBookings(supabase, 4),
    getRecentActivity(supabase, 8),
    countSubmittedHomework(supabase),
    listSubmittedHomework(supabase, 3),
    getAppValueStats(supabase, org!.id, 7),
  ]);

  const oldestNeedingNotes = await getOldestLessonNeedingNotes(supabase);

  const completeness = computeProfileCompleteness(publicProfile);
  const firstName = profile.full_name?.split(" ")[0] ?? "profesore";

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
  const showOnboarding = (activeStudents ?? 0) === 0;
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
    <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Trial banner — only when relevant */}
      {daysLeft <= 7 && (
        <div className="rounded-lg border border-border bg-secondary/40 px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="size-3.5 text-muted-foreground shrink-0" strokeWidth={2} />
            <span className="truncate">
              <span className="font-medium">
                {daysLeft} {daysLeft === 1 ? "dan" : "dana"} probnog perioda
              </span>
              <span className="text-muted-foreground">
                {" "}
                preostalo · plan{" "}
                <span className="text-foreground">{org?.subscription_tier}</span>
              </span>
            </span>
          </div>
          <Link
            href="/settings"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Nadogradi
          </Link>
        </div>
      )}

      {/* Header — single row: greeting + actions */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {dayName}, {dayNum}. {monthName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
            Dobar dan, {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground">
            {(activeStudents ?? 0) > 0
              ? `${activeStudents} ${activeStudents === 1 ? "aktivan učenik" : "aktivnih učenika"} · ${analytics.scheduled} predstojećih u periodu`
              : "Spremno je za nedelju koja dolazi."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/students/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Učenik
          </Link>
          <Link
            href="/schedule"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <CalendarDays className="size-3.5" strokeWidth={1.75} />
            Raspored
          </Link>
          <Link
            href="/exercises/new"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <Sparkles className="size-3.5" strokeWidth={1.75} />
            Zadaci
          </Link>
        </div>
      </header>

      {/* Main 8/4 grid */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Main column */}
        <div className="lg:col-span-8 space-y-5 min-w-0">
          {showOnboarding && <NextStepsCard />}

          {/* Pending work — top of main column */}
          {pendingItems.length > 0 && <PendingWork items={pendingItems} />}

          {/* Upcoming lessons — primary work surface */}
          <UpcomingCard lessons={upcomingLessons} />

          {/* Activity */}
          <RecentActivity events={recentActivity} />

          {/* Analytics */}
          <AnalyticsSection stats={analytics} period={period} />
        </div>

        {/* Side rail */}
        <aside className="lg:col-span-4 space-y-5 min-w-0">
          {recentBookings.length > 0 && (
            <BookingsPreview bookings={recentBookings} />
          )}

          {/* Mini snapshot — debt + notes inline */}
          <SideSnapshot
            debt={debtors.totalDebt}
            debtorCount={debtors.debtors.length}
            missingNotes={missingNotesCount}
            submittedHomework={submittedHomeworkCount}
          />

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

          <AppValueWidget stats={appValueStats} />
        </aside>
      </div>
    </div>
  );
}

/* ---------- pending work (unified) ---------- */
type PendingItem = {
  key: string;
  icon: typeof StickyNote;
  title: string;
  detail?: string;
  count: number;
  countLabel?: string;
  href: string;
  cta: string;
  ctaIcon?: typeof StickyNote;
  tone?: "default" | "warning";
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
      count: debtors.debtors.length,
      countLabel:
        debtors.debtors.length === 1 ? "učenik" : "učenika",
      href: "/billing",
      cta: "Naplati",
      tone: "warning",
    });
  }

  if (missingNotesCount > 0 && oldestNeedingNotes) {
    const dt = new Date(oldestNeedingNotes.scheduled_at);
    items.push({
      key: "notes",
      icon: StickyNote,
      title: `${missingNotesCount} ${missingNotesCount === 1 ? "čas bez beleške" : "časova bez beleške"}`,
      detail: `${oldestNeedingNotes.student_name} · ${dt.toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "short" })}`,
      count: missingNotesCount,
      href: `/lessons/${oldestNeedingNotes.id}/note`,
      cta: "Snimi za poslednji",
      ctaIcon: Mic,
    });
  }

  if (submittedHomeworkCount > 0) {
    const top = submittedHomework[0];
    items.push({
      key: "homework",
      icon: ClipboardCheck,
      title: `${submittedHomeworkCount} ${submittedHomeworkCount === 1 ? "domaći" : "domaća"} za pregled`,
      detail: top ? `${top.student_name} · ${top.title}` : undefined,
      count: submittedHomeworkCount,
      href: top ? `/students/${top.student_id}` : "/students",
      cta: "Pregledaj",
      ctaIcon: Check,
    });
  }

  return items;
}

function PendingWork({ items }: { items: PendingItem[] }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-medium">Akcije danas</h2>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground tabular-nums">
          {items.length} {items.length === 1 ? "stavka" : "stavki"}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const Icon = item.icon;
          const CtaIcon = item.ctaIcon;
          return (
            <li
              key={item.key}
              className="px-5 py-3.5 flex items-center gap-3"
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-md shrink-0",
                  item.tone === "warning"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.detail && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.detail}
                  </p>
                )}
              </div>
              <Link
                href={item.href}
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "shrink-0",
                )}
              >
                {CtaIcon && <CtaIcon className="size-3.5" strokeWidth={1.75} />}
                {item.cta}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- side snapshot ---------- */
function SideSnapshot({
  debt,
  debtorCount,
  missingNotes,
  submittedHomework,
}: {
  debt: number;
  debtorCount: number;
  missingNotes: number;
  submittedHomework: number;
}) {
  const allClear = debt === 0 && missingNotes === 0 && submittedHomework === 0;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-medium">Trenutno stanje</h2>
      </div>
      {allClear ? (
        <div className="px-5 py-6 text-center">
          <div className="inline-flex size-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 mb-2">
            <Check className="size-4" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium">Sve čisto.</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nema dugova, beleški ni domaćih da te čeka.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          <SnapshotRow
            href="/billing"
            label="Dug"
            value={debt > 0 ? formatRsd(debt) : "—"}
            hint={
              debt > 0
                ? `${debtorCount} ${debtorCount === 1 ? "učenik" : "učenika"}`
                : "Nema dugovanja"
            }
            tone={debt > 0 ? "warning" : "muted"}
          />
          <SnapshotRow
            href="/schedule"
            label="Beleške fale"
            value={missingNotes > 0 ? String(missingNotes) : "—"}
            hint={missingNotes > 0 ? "održanih časova" : "Sve popunjeno"}
            tone={missingNotes > 0 ? "warning" : "muted"}
          />
          <SnapshotRow
            href="/students"
            label="Domaći za pregled"
            value={submittedHomework > 0 ? String(submittedHomework) : "—"}
            hint={
              submittedHomework > 0
                ? `${submittedHomework === 1 ? "predat" : "predata"} čeka ocenu`
                : "Nema neocenjenih"
            }
            tone={submittedHomework > 0 ? "warning" : "muted"}
          />
        </ul>
      )}
    </section>
  );
}

function SnapshotRow({
  href,
  label,
  value,
  hint,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  tone: "warning" | "muted";
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-baseline justify-between gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors group"
      >
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {hint}
          </p>
        </div>
        <span
          className={cn(
            "text-lg font-medium tabular-nums shrink-0",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {value}
        </span>
      </Link>
    </li>
  );
}

/* ---------- next steps card (onboarding) ---------- */
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
function UpcomingCard({ lessons }: { lessons: UpcomingLesson[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
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
              <li key={l.id}>
                <Link
                  href={`/schedule?lesson=${l.id}`}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="text-xs tabular-nums w-20 shrink-0">
                    <div className="text-muted-foreground">{dateLabel}</div>
                    <div className="text-foreground font-medium">
                      {timeLabel}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {l.students?.full_name ?? "Učenik"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.duration_minutes} min
                    </p>
                  </div>
                  <ArrowRight
                    className="size-3.5 text-muted-foreground/40"
                    strokeWidth={1.75}
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
