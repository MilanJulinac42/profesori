import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  School,
  GraduationCap,
  Banknote,
  CalendarDays,
  StickyNote,
  Archive,
  Star,
  CheckCircle2,
  Wallet,
  Clock,
  LayoutDashboard,
  ClipboardList,
  FileText,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { TabNav, type TabItem } from "@/components/ui/tab-nav";
import { StatCard } from "@/components/dashboard/stat-card";
import { cn } from "@/lib/utils";
import { formatRsd } from "@/lib/money";
import {
  EDUCATION_LABELS,
  STATUS_LABELS,
  type EducationLevel,
  type Student,
  type StudentStatus,
} from "@/lib/students/types";
import { archiveStudent } from "@/lib/students/actions";
import {
  LESSON_STATUS_LABELS,
  type Lesson,
  type LessonStatus,
} from "@/lib/lessons/types";
import { getStudentBilling } from "@/lib/payments/queries";
import { getRemindersForStudent } from "@/lib/reminders/queries";
import { listReportLogs } from "@/lib/reports/queries";
import { listHomeworkForStudent } from "@/lib/homework/queries";
import { BillingSection } from "./_components/billing-section";
import { ReportsPanel } from "./_components/reports-panel";
import { HomeworkPanel } from "./_components/homework-panel";
import { ParentLinkButton } from "./_components/parent-link-button";
import { PlanTab } from "./_components/plan-tab";
import { getStudentPlan, listOrgCurricula } from "@/lib/curriculum/queries";
import {
  getSupabase,
  getTeacherCtx,
  getStudentLessons,
  getStudentBillingCached,
  getHomeworkCount,
  getReportsCount,
} from "./_data";

type TabValue =
  | "pregled"
  | "naplata"
  | "casovi"
  | "domaci"
  | "izvestaji"
  | "plan";

const ALLOWED_TABS: TabValue[] = [
  "pregled",
  "naplata",
  "casovi",
  "domaci",
  "izvestaji",
  "plan",
];

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: TabValue = ALLOWED_TABS.includes(sp.tab as TabValue)
    ? (sp.tab as TabValue)
    : "pregled";

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) notFound();
  const s = data as Student;

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 group"
        >
          <ArrowLeft
            className="size-3.5 group-hover:-translate-x-0.5 transition-transform"
            strokeWidth={1.75}
          />
          Nazad na učenike
        </Link>
      </div>

      <HeroHeader student={s} appBaseUrl={appBaseUrl} />

      <Suspense fallback={<StatStripSkeleton />}>
        <StatStripBlock student={s} />
      </Suspense>

      <Suspense fallback={<TabNavSkeleton studentId={s.id} active={tab} />}>
        <TabNavBlock studentId={s.id} active={tab} />
      </Suspense>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          <Suspense fallback={<TabContentSkeleton />}>
            <TabContentBlock student={s} tab={tab} appBaseUrl={appBaseUrl} />
          </Suspense>
        </div>

        <aside className="space-y-6">
          <Panel title="Obrazovanje">
            <Row icon={GraduationCap} label="Razred" value={s.grade} />
            <Row
              icon={School}
              label="Nivo"
              value={
                s.school
                  ? (EDUCATION_LABELS[s.school as EducationLevel] ?? s.school)
                  : null
              }
            />
          </Panel>
          <Panel title="Roditelj">
            <Row label="Ime" value={s.parent_name} />
            <Row icon={Phone} label="Telefon" value={s.parent_phone} />
            <Row icon={Mail} label="Email" value={s.parent_email} />
          </Panel>
          {s.notes && (
            <Panel title="Beleška o učeniku" icon={StickyNote}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {s.notes}
              </p>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ---------- HERO HEADER (sync, from student row) ---------- */
function HeroHeader({
  student: s,
  appBaseUrl,
}: {
  student: Student;
  appBaseUrl: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-hero-mesh border border-border/60 dark:border-white/[0.08]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/15"
      />
      <div className="relative px-6 sm:px-10 py-7 sm:py-9 flex flex-col sm:flex-row sm:items-center gap-6">
        <Avatar name={s.full_name} size="xl" className="size-20 text-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl sm:text-4xl text-foreground leading-none">
              {s.full_name}
            </h1>
            <StatusPill status={s.status} />
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {s.grade && (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap
                  className="size-3.5 text-muted-foreground/60"
                  strokeWidth={1.75}
                />
                {s.grade}
              </span>
            )}
            {s.parent_name && (
              <>
                <span aria-hidden className="text-muted-foreground/40">·</span>
                <span>roditelj {s.parent_name}</span>
              </>
            )}
            {s.parent_phone && (
              <>
                <span aria-hidden className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Phone
                    className="size-3.5 text-muted-foreground/60"
                    strokeWidth={1.75}
                  />
                  {s.parent_phone}
                </span>
              </>
            )}
          </div>
          {s.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-card/70 backdrop-blur-sm border border-border/60 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ParentLinkButton
            studentId={s.id}
            studentName={s.full_name}
            initialToken={s.parent_portal_token}
            parentName={s.parent_name}
            parentPhone={s.parent_phone}
            parentEmail={s.parent_email}
            appBaseUrl={appBaseUrl}
          />
          <Link
            href={`/students/${s.id}/edit`}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-card/70 backdrop-blur-md border border-border text-sm font-medium hover:bg-card transition-colors"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
            Izmeni
          </Link>
          <form action={archiveStudent.bind(null, s.id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Archive className="size-3.5" strokeWidth={1.75} />
              Arhiviraj
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ---------- STAT STRIP (Suspense) ---------- */
async function StatStripBlock({ student: s }: { student: Student }) {
  const [lessons, billing] = await Promise.all([
    getStudentLessons(s.id),
    getStudentBillingCached(s.id),
  ]);
  const totalLessonsHeld = lessons.filter(
    (l) => l.status === "completed",
  ).length;
  const upcomingLessons = lessons.filter(
    (l) => l.status === "scheduled" && new Date(l.scheduled_at) >= new Date(),
  );
  const nextLesson = upcomingLessons[upcomingLessons.length - 1];

  const debtTile: "rose" | "emerald" | "cyan" =
    billing.debt > 0 ? "rose" : billing.debt < 0 ? "emerald" : "cyan";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label={billing.debt < 0 ? "Pretplata" : "Dug"}
        value={
          billing.debt < 0
            ? formatRsd(-billing.debt, false)
            : formatRsd(billing.debt, false)
        }
        unit="RSD"
        icon={Wallet}
        tile={debtTile}
        hint={
          billing.debt > 0
            ? `${billing.unpaidLessons.length} neplaćenih`
            : billing.debt < 0
              ? "Učenik je preplatio"
              : billing.billableLessonsCount > 0
                ? "Sve plaćeno"
                : "Nema naplata"
        }
      />
      <StatCard
        label="Časova održano"
        value={String(totalLessonsHeld)}
        icon={CheckCircle2}
        tile="cyan"
        hint={`${lessons.length} ukupno`}
      />
      <StatCard
        label="Sledeći čas"
        value={
          nextLesson
            ? new Date(nextLesson.scheduled_at).toLocaleDateString(
                "sr-Latn-RS",
                { day: "numeric", month: "short" },
              )
            : "—"
        }
        icon={Clock}
        tile="violet"
        hint={
          nextLesson
            ? new Date(nextLesson.scheduled_at).toLocaleTimeString(
                "sr-Latn-RS",
                { hour: "2-digit", minute: "2-digit" },
              )
            : "Nije zakazan"
        }
      />
      <StatCard
        label="Cena po času"
        value={
          s.default_price_per_lesson > 0
            ? formatRsd(s.default_price_per_lesson, false)
            : "—"
        }
        unit={s.default_price_per_lesson > 0 ? "RSD" : undefined}
        icon={Banknote}
        tile="amber"
        hint={`${s.default_lesson_duration_minutes} min default`}
      />
    </div>
  );
}

function StatStripSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="card-elevated rounded-2xl h-[140px] animate-pulse"
        />
      ))}
    </div>
  );
}

/* ---------- TAB NAV (Suspense) ---------- */
async function TabNavBlock({
  studentId,
  active,
}: {
  studentId: string;
  active: TabValue;
}) {
  const [lessons, billing, homeworkCount, reportsCount] = await Promise.all([
    getStudentLessons(studentId),
    getStudentBillingCached(studentId),
    getHomeworkCount(studentId),
    getReportsCount(studentId),
  ]);
  const TABS: TabItem<TabValue>[] = [
    { value: "pregled", label: "Pregled", icon: LayoutDashboard },
    {
      value: "naplata",
      label: "Naplata",
      icon: Wallet,
      badge: billing.unpaidLessons.length,
    },
    {
      value: "casovi",
      label: "Časovi",
      icon: CalendarDays,
      badge: lessons.length,
    },
    {
      value: "domaci",
      label: "Domaći",
      icon: ClipboardList,
      badge: homeworkCount,
    },
    {
      value: "izvestaji",
      label: "Izveštaji",
      icon: FileText,
      badge: reportsCount,
    },
    { value: "plan", label: "Plan", icon: Compass },
  ];
  return (
    <TabNav
      basePath={`/students/${studentId}`}
      active={active}
      tabs={TABS}
      param="tab"
    />
  );
}

function TabNavSkeleton({
  studentId,
  active,
}: {
  studentId: string;
  active: TabValue;
}) {
  // Render tabs immediately without badges; the real block fills them in.
  const TABS: TabItem<TabValue>[] = [
    { value: "pregled", label: "Pregled", icon: LayoutDashboard },
    { value: "naplata", label: "Naplata", icon: Wallet },
    { value: "casovi", label: "Časovi", icon: CalendarDays },
    { value: "domaci", label: "Domaći", icon: ClipboardList },
    { value: "izvestaji", label: "Izveštaji", icon: FileText },
    { value: "plan", label: "Plan", icon: Compass },
  ];
  return (
    <TabNav
      basePath={`/students/${studentId}`}
      active={active}
      tabs={TABS}
      param="tab"
    />
  );
}

/* ---------- TAB CONTENT (Suspense) ---------- */
async function TabContentBlock({
  student: s,
  tab,
  appBaseUrl,
}: {
  student: Student;
  tab: TabValue;
  appBaseUrl: string;
}) {
  switch (tab) {
    case "pregled":
      return <OverviewTabBlock student={s} />;
    case "naplata":
      return <BillingTabBlock student={s} />;
    case "casovi":
      return <LessonsTabBlock studentId={s.id} />;
    case "domaci":
      return <HomeworkTabBlock student={s} appBaseUrl={appBaseUrl} />;
    case "izvestaji":
      return <ReportsTabBlock student={s} />;
    case "plan":
      return <PlanTabBlock student={s} />;
  }
}

async function PlanTabBlock({ student: s }: { student: Student }) {
  const supabase = await getSupabase();
  const [plan, orgCurricula] = await Promise.all([
    getStudentPlan(supabase, s.id),
    listOrgCurricula(supabase),
  ]);
  return (
    <PlanTab
      studentId={s.id}
      studentName={s.full_name}
      plan={plan}
      availableCurricula={orgCurricula.filter((c) => c.is_active)}
    />
  );
}

async function OverviewTabBlock({ student: s }: { student: Student }) {
  const [lessons, billing, homeworkCount, reportsCount] = await Promise.all([
    getStudentLessons(s.id),
    getStudentBillingCached(s.id),
    getHomeworkCount(s.id),
    getReportsCount(s.id),
  ]);
  const upcomingLessons = lessons.filter(
    (l) => l.status === "scheduled" && new Date(l.scheduled_at) >= new Date(),
  );
  const nextLesson = upcomingLessons[upcomingLessons.length - 1];
  const totalLessonsHeld = lessons.filter(
    (l) => l.status === "completed",
  ).length;
  return (
    <OverviewTab
      studentId={s.id}
      billing={billing}
      upcomingCount={upcomingLessons.length}
      nextLesson={nextLesson}
      totalLessonsHeld={totalLessonsHeld}
      homeworkCount={homeworkCount}
      reportsCount={reportsCount}
      lessons={lessons}
    />
  );
}

async function BillingTabBlock({ student: s }: { student: Student }) {
  const supabase = await getSupabase();
  const [billing, reminders, ctx] = await Promise.all([
    getStudentBillingCached(s.id),
    getRemindersForStudent(supabase, s.id, 20),
    getTeacherCtx(),
  ]);
  return (
    <BillingSection
      studentId={s.id}
      studentName={s.full_name}
      parentName={s.parent_name}
      parentPhone={s.parent_phone}
      parentEmail={s.parent_email}
      teacherName={ctx.teacherName}
      debt={billing.debt}
      paidTotal={billing.paidTotal}
      billableTotal={billing.billableTotal}
      unpaidLessons={billing.unpaidLessons}
      unpaidLessonsCount={billing.unpaidLessons.length}
      oldestUnpaidAt={billing.oldestUnpaidAt}
      payments={billing.payments}
      reminders={reminders}
      customTemplate={ctx.settings.reminder_template ?? null}
    />
  );
}

async function LessonsTabBlock({ studentId }: { studentId: string }) {
  const lessons = await getStudentLessons(studentId);
  const upcomingLessons = lessons.filter(
    (l) => l.status === "scheduled" && new Date(l.scheduled_at) >= new Date(),
  );
  const pastLessons = lessons.filter(
    (l) =>
      !(l.status === "scheduled" && new Date(l.scheduled_at) >= new Date()),
  );
  return (
    <>
      <LessonsList upcoming={upcomingLessons} past={pastLessons} />
      <NotesList lessons={lessons} />
    </>
  );
}

async function HomeworkTabBlock({
  student: s,
  appBaseUrl,
}: {
  student: Student;
  appBaseUrl: string;
}) {
  const supabase = await getSupabase();
  const homeworkItems = await listHomeworkForStudent(supabase, s.id, 20);
  return (
    <HomeworkPanel
      studentName={s.full_name}
      parentPhone={s.parent_phone}
      items={homeworkItems}
      appBaseUrl={appBaseUrl}
    />
  );
}

async function ReportsTabBlock({ student: s }: { student: Student }) {
  const supabase = await getSupabase();
  const reportLogs = await listReportLogs(supabase, s.id, 12);
  return (
    <ReportsPanel
      studentId={s.id}
      studentName={s.full_name}
      hasParentEmail={!!s.parent_email}
      hasStudentEmail={!!s.student_email}
      parentPhone={s.parent_phone}
      audience={s.report_audience}
      weeklyEnabled={s.weekly_reports_enabled}
      monthlyEnabled={s.monthly_reports_enabled}
      logs={reportLogs}
    />
  );
}

function TabContentSkeleton() {
  return (
    <div className="space-y-5">
      <div className="card-elevated rounded-2xl h-[200px] animate-pulse" />
      <div className="card-elevated rounded-2xl h-[300px] animate-pulse" />
    </div>
  );
}

/* ---------- OVERVIEW TAB ---------- */
function OverviewTab({
  studentId,
  billing,
  upcomingCount,
  nextLesson,
  totalLessonsHeld,
  homeworkCount,
  reportsCount,
  lessons,
}: {
  studentId: string;
  billing: Awaited<ReturnType<typeof getStudentBilling>>;
  upcomingCount: number;
  nextLesson: Lesson | undefined;
  totalLessonsHeld: number;
  homeworkCount: number;
  reportsCount: number;
  lessons: Lesson[];
}) {
  // Latest note (if any) for showcase
  const latestNote = lessons.find(
    (l) =>
      l.notes_after_lesson ||
      (l.topics_covered && l.topics_covered.length > 0),
  );

  // Recent payments
  const recentPayments = billing.payments.slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Quick section cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <OverviewCard
          href={`/students/${studentId}?tab=naplata`}
          title="Naplata"
          tile={
            billing.debt > 0 ? "rose" : billing.debt < 0 ? "emerald" : "cyan"
          }
          icon={Wallet}
          headline={
            billing.debt > 0
              ? `${formatRsd(billing.debt, false)} RSD duga`
              : billing.debt < 0
                ? `${formatRsd(-billing.debt, false)} RSD pretplata`
                : "Sve plaćeno"
          }
          detail={
            billing.unpaidLessons.length > 0
              ? `${billing.unpaidLessons.length} neplaćenih časova`
              : `${billing.payments.length} ${
                  billing.payments.length === 1
                    ? "uplata"
                    : billing.payments.length < 5
                      ? "uplate"
                      : "uplata"
                } ukupno`
          }
        />
        <OverviewCard
          href={`/students/${studentId}?tab=casovi`}
          title="Časovi"
          tile="cyan"
          icon={CalendarDays}
          headline={
            nextLesson
              ? new Date(nextLesson.scheduled_at).toLocaleDateString(
                  "sr-Latn-RS",
                  {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  },
                ) +
                " · " +
                new Date(nextLesson.scheduled_at).toLocaleTimeString(
                  "sr-Latn-RS",
                  { hour: "2-digit", minute: "2-digit" },
                )
              : "Bez zakazanih"
          }
          detail={
            nextLesson
              ? `${upcomingCount} predstojećih · ${totalLessonsHeld} održanih`
              : `${totalLessonsHeld} ${
                  totalLessonsHeld === 1
                    ? "održan čas"
                    : totalLessonsHeld < 5
                      ? "održana časa"
                      : "održanih časova"
                }`
          }
        />
        <OverviewCard
          href={`/students/${studentId}?tab=domaci`}
          title="Domaći"
          tile="violet"
          icon={ClipboardList}
          headline={
            homeworkCount > 0
              ? `${homeworkCount} ${
                  homeworkCount === 1
                    ? "zadatak"
                    : homeworkCount < 5
                      ? "zadatka"
                      : "zadataka"
                }`
              : "Nema zadataka"
          }
          detail={
            homeworkCount > 0
              ? "klikni za detalje i status"
              : "kreiraj prvi zadatak"
          }
        />
        <OverviewCard
          href={`/students/${studentId}?tab=izvestaji`}
          title="Izveštaji"
          tile="amber"
          icon={FileText}
          headline={
            reportsCount > 0
              ? `${reportsCount} ${
                  reportsCount === 1
                    ? "poslat"
                    : reportsCount < 5
                      ? "poslata"
                      : "poslatih"
                }`
              : "Još nije slato"
          }
          detail={
            reportsCount > 0
              ? "klikni za istoriju"
              : "podesi automatske izveštaje"
          }
        />
      </div>

      {/* Recent payments preview */}
      {recentPayments.length > 0 && (
        <div className="card-elevated card-glow rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg text-foreground">
              Poslednje uplate
            </h3>
            <Link
              href={`/students/${studentId}?tab=naplata`}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 group"
            >
              Sve uplate
              <span aria-hidden className="group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recentPayments.map((p) => {
              const dt = new Date(p.paid_at);
              return (
                <li
                  key={p.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {dt.toLocaleDateString("sr-Latn-RS", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    {formatRsd(p.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Latest note preview */}
      {latestNote && (
        <div className="card-elevated card-glow rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-foreground inline-flex items-center gap-2">
              <StickyNote
                className="size-4 text-muted-foreground"
                strokeWidth={1.75}
              />
              Poslednja beleška
            </h3>
            <Link
              href={`/students/${studentId}?tab=casovi`}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 group"
            >
              Sve beleške
              <span aria-hidden className="group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2 tabular-nums">
            {new Date(latestNote.scheduled_at).toLocaleDateString("sr-Latn-RS", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "2-digit",
            })}
          </p>
          {latestNote.topics_covered && latestNote.topics_covered.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {latestNote.topics_covered.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {latestNote.notes_after_lesson && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {latestNote.notes_after_lesson}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OverviewCard({
  href,
  title,
  headline,
  detail,
  icon: Icon,
  tile,
}: {
  href: string;
  title: string;
  headline: string;
  detail: string;
  icon: typeof Banknote;
  tile: "cyan" | "magenta" | "rose" | "amber" | "emerald" | "violet" | "sky";
}) {
  return (
    <Link
      href={href}
      className="card-elevated card-glow rounded-2xl p-5 flex flex-col gap-3 group transition-all hover:translate-y-[-2px]"
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            `tile-${tile}`,
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
          {title}
        </span>
      </div>
      <p className="font-display text-2xl text-foreground tabular-nums leading-none">
        {headline}
      </p>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
        <span
          aria-hidden
          className="text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all text-sm"
        >
          →
        </span>
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: StudentStatus }) {
  const tile: "emerald" | "amber" | "rose" =
    status === "active"
      ? "emerald"
      : status === "paused"
        ? "amber"
        : "rose";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        `tile-${tile}`,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "active" && "bg-emerald-500 dark:bg-emerald-400",
          status === "paused" && "bg-amber-500 dark:bg-amber-400",
          status === "inactive" && "bg-rose-500 dark:bg-rose-400",
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Banknote;
  children: React.ReactNode;
}) {
  return (
    <div className="card-elevated card-glow rounded-2xl p-5">
      <h3 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground inline-flex items-center gap-1.5 mb-3">
        {Icon && <Icon className="size-3" strokeWidth={2} />}
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function LessonsList({
  upcoming,
  past,
}: {
  upcoming: Lesson[];
  past: Lesson[];
}) {
  return (
    <div className="card-elevated card-glow rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-display text-xl text-foreground">Časovi</h2>
      </div>
      {upcoming.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-secondary/30 border-b border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Predstojeći ({upcoming.length})
            </p>
          </div>
          <ul className="divide-y divide-border">
            {upcoming.map((l) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </ul>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-secondary/30 border-b border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Istorija ({past.length})
            </p>
          </div>
          <ul className="divide-y divide-border">
            {past.slice(0, 20).map((l) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </ul>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && (
        <div className="py-6">
          <EmptyState
            icon={CalendarDays}
            tile="violet"
            title="Još nema časova"
            description="Otvori raspored i zakaži prvi čas za ovog učenika."
            action={
              <Link
                href="/schedule"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
              >
                <CalendarDays className="size-3.5" strokeWidth={2.25} />
                Otvori raspored
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}

function NotesList({ lessons }: { lessons: Lesson[] }) {
  const withNotes = lessons.filter(
    (l) =>
      l.notes_after_lesson ||
      (l.topics_covered && l.topics_covered.length > 0) ||
      l.lesson_rating !== null ||
      l.next_lesson_plan,
  );

  if (withNotes.length === 0) {
    return (
      <div className="card-elevated card-glow rounded-2xl p-6">
        <h2 className="font-display text-xl text-foreground">
          Beleške posle časova
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Posle svakog završenog časa, kad popuniš beleške u dialogu časa,
          one će se pojaviti ovde.
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated card-glow rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-display text-xl text-foreground">
          Beleške posle časova
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {withNotes.length}{" "}
          {withNotes.length === 1
            ? "beleška"
            : withNotes.length < 5
              ? "beleške"
              : "beleški"}
        </p>
      </div>
      <ul className="divide-y divide-border">
        {withNotes.slice(0, 10).map((l) => (
          <NoteRow key={l.id} lesson={l} />
        ))}
      </ul>
    </div>
  );
}

function NoteRow({ lesson }: { lesson: Lesson }) {
  const dt = new Date(lesson.scheduled_at);
  return (
    <li className="px-5 py-4">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs text-muted-foreground tabular-nums">
          {dt.toLocaleDateString("sr-Latn-RS", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "2-digit",
          })}
        </p>
        {lesson.lesson_rating !== null && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  "size-3",
                  n <= (lesson.lesson_rating ?? 0)
                    ? "fill-foreground text-foreground"
                    : "text-muted-foreground/30",
                )}
                strokeWidth={1.75}
              />
            ))}
          </div>
        )}
      </div>
      {lesson.topics_covered && lesson.topics_covered.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lesson.topics_covered.map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {lesson.notes_after_lesson && (
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {lesson.notes_after_lesson}
        </p>
      )}
      {lesson.next_lesson_plan && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            Za sledeći put
          </p>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {lesson.next_lesson_plan}
          </p>
        </div>
      )}
    </li>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const dt = new Date(lesson.scheduled_at);
  return (
    <li className="px-5 py-3 flex items-center gap-4">
      <div className="text-xs tabular-nums w-24 shrink-0">
        <div className="text-muted-foreground">
          {dt.toLocaleDateString("sr-Latn-RS", {
            day: "numeric",
            month: "short",
          })}
        </div>
        <div className="font-medium">
          {dt.toLocaleTimeString("sr-Latn-RS", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <Badge variant="outline" className="font-normal text-[10px]">
          {LESSON_STATUS_LABELS[lesson.status as LessonStatus]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {lesson.duration_minutes} min
        </span>
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">
        {lesson.price > 0 ? formatRsd(lesson.price) : "—"}
      </div>
    </li>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Banknote;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && (
        <Icon
          className="size-3.5 text-muted-foreground mt-0.5 shrink-0"
          strokeWidth={1.75}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium break-words">{value}</div>
      </div>
    </div>
  );
}
