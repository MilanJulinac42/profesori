import { redirect } from "next/navigation";
import {
  Calendar,
  Mail,
  ClipboardList,
  Wallet,
  GraduationCap,
  Star,
  Clock,
  TrendingUp,
  Check,
  AlertCircle,
  Receipt,
  CalendarDays,
  Phone,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { srLatn } from "date-fns/locale";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getParentSession } from "@/lib/parent-portal/auth";
import { formatRsd } from "@/lib/money";
import { computeBillableStatuses, type Payment } from "@/lib/payments/types";
import { getOrgSettings } from "@/lib/settings/queries";
import { getStudentBilling } from "@/lib/payments/queries";
import { Avatar } from "@/components/ui/avatar";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { QuickContactDock } from "@/app/p/[slug]/_components/quick-contact-dock";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ParentReportRow } from "./_components/report-row";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

type Tile = "cyan" | "magenta" | "rose" | "amber" | "emerald" | "violet" | "sky";

type LessonRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  price: number;
  lesson_rating: number | null;
  notes_after_lesson: string | null;
  topics_covered: string[] | null;
};

export default async function ParentDashboard() {
  const session = await getParentSession();
  if (!session) redirect("/r/expired");

  const supabase = getServiceClient();
  const { studentId, studentName, parentName, teacherName, organizationId } =
    session;

  const settings = await getOrgSettings(supabase, organizationId);
  const billableStatuses = computeBillableStatuses(settings);

  // Last 120 days range for heatmap
  const heatmapSince = new Date();
  heatmapSince.setDate(heatmapSince.getDate() - 90);

  const [
    allLessonsRes,
    hwRes,
    reportsRes,
    studentRes,
    teacherRes,
    billing,
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        "id, scheduled_at, duration_minutes, status, price, lesson_rating, notes_after_lesson, topics_covered",
      )
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("homework")
      .select("id, title, status, public_token, due_date, created_at")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("report_logs")
      .select(
        "id, kind, period_start, period_end, status, sent_at, html_body, updated_at, data_snapshot",
      )
      .eq("student_id", studentId)
      .in("status", ["sent", "draft"])
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("students")
      .select("photo_url, grade, default_price_per_lesson")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("phone, email")
      .eq("organization_id", organizationId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle(),
    getStudentBilling(supabase, studentId, billableStatuses),
  ]);

  const allLessons = (allLessonsRes.data ?? []) as LessonRow[];
  const homework = (hwRes.data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    public_token: string;
    due_date: string | null;
    created_at: string;
  }>;
  const reports = (reportsRes.data ?? []) as Array<{
    id: string;
    kind: string;
    period_start: string;
    period_end: string;
    sent_at: string;
  }>;
  const studentMeta = studentRes.data as {
    photo_url: string | null;
    grade: string | null;
    default_price_per_lesson: number | null;
  } | null;
  const teacherMeta = teacherRes.data as {
    phone: string | null;
    email: string | null;
  } | null;

  // Past completed lessons (for history + ratings + heatmap)
  const completedLessons = allLessons.filter((l) => l.status === "completed");
  const totalCompleted = completedLessons.length;
  const totalMinutes = completedLessons.reduce(
    (s, l) => s + l.duration_minutes,
    0,
  );

  // Average rating from rated completed lessons (last 90 days)
  const recentCompleted = completedLessons.filter(
    (l) => new Date(l.scheduled_at) >= heatmapSince,
  );
  const ratedLessons = recentCompleted.filter(
    (l) => typeof l.lesson_rating === "number",
  );
  const avgRating =
    ratedLessons.length > 0
      ? ratedLessons.reduce((s, l) => s + (l.lesson_rating ?? 0), 0) /
        ratedLessons.length
      : null;

  // Upcoming lessons
  const now = new Date();
  const upcomingLessons = allLessons
    .filter(
      (l) => l.status === "scheduled" && new Date(l.scheduled_at) >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() -
        new Date(b.scheduled_at).getTime(),
    );
  const nextLesson = upcomingLessons[0] ?? null;

  // Recent lessons sa belekama (poslednjih 5 sa beleškama ili topics)
  const recentNotedLessons = completedLessons
    .filter(
      (l) =>
        (l.notes_after_lesson && l.notes_after_lesson.length > 0) ||
        (l.topics_covered && l.topics_covered.length > 0) ||
        l.lesson_rating !== null,
    )
    .slice(0, 5);

  // Homework completion rate (poslednjih 60 dana, za progress score)
  const hwResolved = homework.filter(
    (h) => h.status === "submitted" || h.status === "graded",
  ).length;
  const hwCompletionRate =
    homework.length > 0 ? hwResolved / homework.length : null;

  // Composite progress score 0-100
  const progressScore = computeProgressScore({
    avgRating,
    hwCompletionRate,
    completedCount: recentCompleted.length,
  });

  // Build 90-day heatmap series
  const heatmapSeries = buildHeatmapSeries(allLessons, heatmapSince, now);

  const greeting = parentName ? `Pozdrav, ${parentName}` : `Dobro došli`;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/40 backdrop-blur-md border-b border-border/60 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
            Roditeljski portal
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground mt-1.5 leading-tight">
            {greeting}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        {/* HERO — student card */}
        <section className="card-elevated card-glow rounded-2xl overflow-hidden">
          <div className="relative bg-hero-mesh px-5 sm:px-7 py-6 sm:py-7 flex items-start gap-4 sm:gap-5">
            <Avatar
              name={studentName}
              size="xl"
              className="size-16 sm:size-20 text-xl shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-1">
                Pregled rada
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-foreground leading-tight">
                {studentName}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                {studentMeta?.grade && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap
                        className="size-3.5 text-muted-foreground/60"
                        strokeWidth={1.75}
                      />
                      {studentMeta.grade}
                    </span>
                    <span className="text-muted-foreground/40 mx-2">·</span>
                  </>
                )}
                Profesor{" "}
                <strong className="text-foreground font-semibold">
                  {teacherName}
                </strong>
              </p>
            </div>
          </div>

          {/* Progress + Next lesson row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border">
            <div className="px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                  Napredak
                </p>
                <p className="font-display text-2xl text-foreground tabular-nums leading-none mt-1">
                  {progressScore !== null ? `${progressScore}%` : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {describeProgress(progressScore)}
                </p>
              </div>
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl shrink-0",
                  progressTile(progressScore),
                )}
              >
                <TrendingUp className="size-5" strokeWidth={2} />
              </div>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                  Sledeći čas
                </p>
                {nextLesson ? (
                  <>
                    <p className="font-display text-base text-foreground leading-tight mt-1">
                      {format(new Date(nextLesson.scheduled_at), "EEEE, d. MMMM", {
                        locale: srLatn,
                      })}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
                      {format(new Date(nextLesson.scheduled_at), "HH:mm")} ·{" "}
                      {nextLesson.duration_minutes} min
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Bez zakazanog
                  </p>
                )}
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl tile-violet shrink-0">
                <CalendarDays className="size-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Mobile-only contact row */}
          {(teacherMeta?.phone || teacherMeta?.email) && (
            <div className="md:hidden border-t border-border px-3 py-3 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground px-2 shrink-0">
                Kontakt
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <MobileContactButtons
                  phone={teacherMeta?.phone ?? null}
                  email={teacherMeta?.email ?? null}
                />
              </div>
            </div>
          )}
        </section>

        {/* Stat strip */}
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-3">
            Statistika
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              icon={GraduationCap}
              label="Časova"
              value={totalCompleted.toString()}
              hint={`${totalMinutes} minuta`}
              tile="cyan"
            />
            <Stat
              icon={Star}
              label="Prosečna ocena"
              value={avgRating !== null ? avgRating.toFixed(1) : "—"}
              hint={
                avgRating !== null
                  ? `${ratedLessons.length} ocena`
                  : "još nema ocena"
              }
              tile="amber"
            />
            <Stat
              icon={ClipboardList}
              label="Domaćih"
              value={`${hwResolved}/${homework.length}`}
              hint={
                homework.length > 0
                  ? hwCompletionRate !== null
                    ? `${Math.round(hwCompletionRate * 100)}% predato`
                    : ""
                  : "nema zadatih"
              }
              tile="violet"
            />
            <Stat
              icon={Wallet}
              label={billing.debt > 0 ? "Dug" : billing.debt < 0 ? "Pretplata" : "Saldo"}
              value={formatRsd(Math.abs(billing.debt))}
              hint={
                billing.debt > 0
                  ? `${billing.unpaidLessons.length} neplaćenih`
                  : billing.debt < 0
                    ? "preplata"
                    : "sve čisto"
              }
              tile={
                billing.debt > 0
                  ? "rose"
                  : billing.debt < 0
                    ? "emerald"
                    : "cyan"
              }
            />
          </div>
        </section>

        {/* Activity heatmap */}
        {recentCompleted.length > 0 && (
          <section className="card-elevated card-glow rounded-2xl p-5 sm:p-6">
            <ActivityHeatmap
              days={heatmapSeries}
              period="all"
              granularity="daily"
            />
          </section>
        )}

        {/* Recent lessons with notes */}
        {recentNotedLessons.length > 0 && (
          <section className="card-elevated card-glow rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg tile-cyan shrink-0">
                <GraduationCap className="size-3.5" strokeWidth={2} />
              </div>
              <h2 className="font-display text-lg text-foreground">
                Šta smo radili
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {recentNotedLessons.map((lesson) => (
                <RecentLessonRow key={lesson.id} lesson={lesson} />
              ))}
            </ul>
          </section>
        )}

        {/* Upcoming lessons */}
        {upcomingLessons.length > 0 && (
          <section className="card-elevated card-glow rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg tile-violet shrink-0">
                <CalendarDays className="size-3.5" strokeWidth={2} />
              </div>
              <h2 className="font-display text-lg text-foreground">
                Predstojeći časovi
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {upcomingLessons.slice(0, 5).map((l) => {
                const dt = new Date(l.scheduled_at);
                const daysFromNow = differenceInDays(dt, now);
                return (
                  <li
                    key={l.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex size-10 flex-col items-center justify-center rounded-lg tile-violet shrink-0 text-center">
                      <span className="text-[9px] uppercase tracking-wider opacity-80 leading-none">
                        {format(dt, "MMM", { locale: srLatn })}
                      </span>
                      <span className="font-display text-lg leading-none tabular-nums mt-0.5">
                        {format(dt, "d")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground capitalize">
                        {format(dt, "EEEE", { locale: srLatn })}
                        <span className="text-muted-foreground/60 mx-1.5">·</span>
                        <span className="tabular-nums">
                          {format(dt, "HH:mm")}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                        {l.duration_minutes} min
                        {daysFromNow === 0 && (
                          <span className="text-emerald-500 dark:text-emerald-400 font-semibold ml-2">
                            danas
                          </span>
                        )}
                        {daysFromNow === 1 && (
                          <span className="text-brand font-semibold ml-2">
                            sutra
                          </span>
                        )}
                        {daysFromNow > 1 && daysFromNow <= 7 && (
                          <span className="text-muted-foreground ml-2">
                            za {daysFromNow} dana
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Domaći */}
        {homework.length > 0 && (
          <section className="card-elevated card-glow rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg tile-amber shrink-0">
                <ClipboardList className="size-3.5" strokeWidth={2} />
              </div>
              <h2 className="font-display text-lg text-foreground">
                Domaći zadaci
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {homework.map((h) => (
                <li
                  key={h.id}
                  className="px-5 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <Link
                    href={`/h/${h.public_token}`}
                    target="_blank"
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {h.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {h.due_date
                          ? `Rok: ${format(new Date(h.due_date), "d. MMM yyyy.", { locale: srLatn })}`
                          : `Zadat: ${format(new Date(h.created_at), "d. MMM yyyy.", { locale: srLatn })}`}
                      </p>
                    </div>
                    <HomeworkStatusBadge status={h.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Naplata */}
        <PaymentsSection
          debt={billing.debt}
          paidTotal={billing.paidTotal}
          billableTotal={billing.billableTotal}
          unpaidLessons={billing.unpaidLessons}
          payments={billing.payments}
        />

        {/* Izveštaji */}
        {reports.length > 0 && (
          <section className="card-elevated card-glow rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg tile-emerald shrink-0">
                <Mail className="size-3.5" strokeWidth={2} />
              </div>
              <h2 className="font-display text-lg text-foreground">
                Poslati izveštaji
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {reports.map((r) => (
                <ParentReportRow key={r.id} report={r} />
              ))}
            </ul>
          </section>
        )}

        <p className="text-[11px] text-muted-foreground/70 text-center pt-4">
          Ovaj portal je privatan. Link je vezan za vaše dete — ne deli ga sa
          drugima.
        </p>
      </main>

      {/* Floating quick contact dock — profesor */}
      <QuickContactDock
        phone={teacherMeta?.phone ?? null}
        email={teacherMeta?.email ?? null}
      />
    </div>
  );
}

/* ---------- Helpers & sub-components ---------- */

function digitsOnly(input: string): string {
  return input.replace(/[^\d]/g, "");
}

function intlDigits(input: string): string {
  const d = digitsOnly(input);
  if (d.startsWith("0")) return "381" + d.slice(1);
  return d;
}

function MobileContactButtons({
  phone,
  email,
}: {
  phone: string | null;
  email: string | null;
}) {
  const intl = phone ? intlDigits(phone) : null;
  const tel = phone ? phone.replace(/[^+\d]/g, "") : null;
  return (
    <>
      {intl && (
        <a
          href={`https://wa.me/${intl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="inline-flex items-center justify-center size-9 rounded-full bg-[#25D366] text-white shadow-[0_4px_12px_-4px_oklch(0.65_0.18_150/0.5)]"
        >
          <WhatsAppIcon className="size-4" />
        </a>
      )}
      {tel && (
        <a
          href={`tel:${tel}`}
          aria-label="Pozovi profesora"
          className="inline-flex items-center justify-center size-9 rounded-full bg-foreground text-background"
        >
          <Phone className="size-4" strokeWidth={2.25} />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          aria-label="Pošalji email"
          className="inline-flex items-center justify-center size-9 rounded-full bg-card border border-border text-foreground"
        >
          <Mail className="size-4" strokeWidth={2} />
        </a>
      )}
    </>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function computeProgressScore({
  avgRating,
  hwCompletionRate,
  completedCount,
}: {
  avgRating: number | null;
  hwCompletionRate: number | null;
  completedCount: number;
}): number | null {
  // Need at least some data to compute
  if (avgRating === null && hwCompletionRate === null && completedCount === 0) {
    return null;
  }
  // Components, each 0..1
  const ratingScore = avgRating !== null ? avgRating / 5 : 0.7;
  const hwScore = hwCompletionRate !== null ? hwCompletionRate : 0.7;
  const consistencyScore = Math.min(1, completedCount / 12); // 12+ lessons in 90d = full

  const weights =
    avgRating !== null && hwCompletionRate !== null
      ? { rating: 0.4, hw: 0.3, consistency: 0.3 }
      : avgRating !== null
        ? { rating: 0.6, hw: 0, consistency: 0.4 }
        : hwCompletionRate !== null
          ? { rating: 0, hw: 0.6, consistency: 0.4 }
          : { rating: 0, hw: 0, consistency: 1 };

  const composite =
    ratingScore * weights.rating +
    hwScore * weights.hw +
    consistencyScore * weights.consistency;
  return Math.round(composite * 100);
}

function describeProgress(score: number | null): string {
  if (score === null) return "još nema podataka";
  if (score >= 85) return "odličan napredak";
  if (score >= 70) return "dobar napredak";
  if (score >= 50) return "u redu";
  return "potrebno više rada";
}

function progressTile(score: number | null): string {
  if (score === null) return "tile-cyan";
  if (score >= 85) return "tile-emerald";
  if (score >= 70) return "tile-cyan";
  if (score >= 50) return "tile-amber";
  return "tile-rose";
}

function buildHeatmapSeries(
  lessons: LessonRow[],
  from: Date,
  to: Date,
): { iso: string; label: string; held: number; revenue: number }[] {
  // Build daily buckets between from and to
  const buckets: Record<
    string,
    { iso: string; label: string; held: number; revenue: number }
  > = {};
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    const iso = format(cursor, "yyyy-MM-dd");
    buckets[iso] = {
      iso,
      label: format(cursor, "d. MMM", { locale: srLatn }),
      held: 0,
      revenue: 0,
    };
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const l of lessons) {
    if (l.status !== "completed") continue;
    const iso = l.scheduled_at.slice(0, 10);
    const b = buckets[iso];
    if (!b) continue;
    b.held += 1;
    b.revenue += l.price;
  }

  return Object.values(buckets);
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tile = "cyan",
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  hint?: string;
  tile?: Tile;
}) {
  return (
    <div className="card-elevated card-glow rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
          {label}
        </span>
        <div
          className={`flex size-8 items-center justify-center rounded-lg shrink-0 tile-${tile}`}
        >
          <Icon className="size-3.5" strokeWidth={2} />
        </div>
      </div>
      <div className="font-display text-2xl text-foreground tabular-nums leading-none">
        {value}
      </div>
      {hint && (
        <p className="text-[11px] text-muted-foreground tabular-nums truncate">
          {hint}
        </p>
      )}
    </div>
  );
}

function RecentLessonRow({ lesson }: { lesson: LessonRow }) {
  const dt = new Date(lesson.scheduled_at);
  const hasNote =
    !!lesson.notes_after_lesson && lesson.notes_after_lesson.length > 0;

  return (
    <li className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs text-muted-foreground tabular-nums capitalize font-medium">
          {format(dt, "EEEE, d. MMMM", { locale: srLatn })}
        </p>
        {lesson.lesson_rating !== null && (
          <div className="flex gap-0.5 shrink-0">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  "size-3",
                  n <= (lesson.lesson_rating ?? 0)
                    ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400"
                    : "text-muted-foreground/25",
                )}
                strokeWidth={1.75}
              />
            ))}
          </div>
        )}
      </div>

      {lesson.topics_covered && lesson.topics_covered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {lesson.topics_covered.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tile-cyan"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {hasNote && (
        <details className="group [&_summary]:list-none">
          <summary className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors select-none">
            <span
              aria-hidden
              className="inline-block transition-transform group-open:rotate-90 leading-none"
            >
              ▸
            </span>
            <span className="group-open:hidden">Profesorova beleška</span>
            <span className="hidden group-open:inline">Sakrij belešku</span>
          </summary>
          <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed border-l-2 border-brand/40 pl-3 mt-2.5">
            {lesson.notes_after_lesson}
          </p>
        </details>
      )}
    </li>
  );
}

function HomeworkStatusBadge({ status }: { status: string }) {
  const tile: Tile =
    status === "submitted"
      ? "amber"
      : status === "graded"
        ? "emerald"
        : status === "skipped"
          ? "rose"
          : "cyan";
  const label =
    status === "submitted"
      ? "Predato"
      : status === "graded"
        ? "Ocenjeno"
        : status === "skipped"
          ? "Preskočeno"
          : "Zadato";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 tile-${tile}`}
    >
      {label}
    </span>
  );
}

function PaymentsSection({
  debt,
  paidTotal,
  billableTotal,
  unpaidLessons,
  payments,
}: {
  debt: number;
  paidTotal: number;
  billableTotal: number;
  unpaidLessons: { id: string; scheduled_at: string; price: number }[];
  payments: Payment[];
}) {
  const hasCredit = debt < 0;
  const isClean = debt === 0 && billableTotal > 0;
  const hasAnything = billableTotal > 0 || payments.length > 0;

  if (!hasAnything) return null;

  return (
    <section className="card-elevated card-glow rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg shrink-0",
            debt > 0 ? "tile-rose" : hasCredit ? "tile-emerald" : "tile-cyan",
          )}
        >
          <Wallet className="size-3.5" strokeWidth={2} />
        </div>
        <h2 className="font-display text-lg text-foreground">Naplata</h2>
      </div>

      {/* Saldo header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
            {debt > 0 ? "Trenutni dug" : hasCredit ? "Pretplata" : "Stanje"}
          </span>
          <span
            className={cn(
              "font-display text-2xl tabular-nums leading-none",
              debt > 0
                ? "text-rose-500 dark:text-rose-400"
                : hasCredit
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-foreground",
            )}
          >
            {hasCredit ? formatRsd(-debt) : formatRsd(debt)}
          </span>
        </div>
        {billableTotal > 0 && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  debt > 0
                    ? "bg-amber-500 dark:bg-amber-400"
                    : "bg-emerald-500 dark:bg-emerald-400",
                )}
                style={{
                  width: `${Math.min(100, (paidTotal / billableTotal) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">
              {formatRsd(paidTotal)} od {formatRsd(billableTotal)} plaćeno
            </p>
          </div>
        )}
        {isClean && (
          <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium inline-flex items-center gap-1.5 mt-2">
            <Check className="size-3" strokeWidth={2.25} />
            Sve plaćeno
          </p>
        )}
      </div>

      {/* Unpaid lessons */}
      {unpaidLessons.length > 0 && (
        <div className="border-b border-border">
          <div className="px-5 py-2.5 bg-secondary/30 flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
              <AlertCircle className="size-3" strokeWidth={2.25} />
              Neplaćeni časovi ({unpaidLessons.length})
            </p>
            <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 tabular-nums">
              {formatRsd(unpaidLessons.reduce((s, l) => s + l.price, 0))}
            </p>
          </div>
          <ul className="divide-y divide-border">
            {unpaidLessons.slice(0, 10).map((l) => {
              const dt = new Date(l.scheduled_at);
              return (
                <li
                  key={l.id}
                  className="px-5 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400"
                    />
                    <span className="text-foreground/90 tabular-nums font-medium">
                      {format(dt, "d. MMM yyyy.", { locale: srLatn })}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatRsd(l.price)}
                  </span>
                </li>
              );
            })}
            {unpaidLessons.length > 10 && (
              <li className="px-5 py-2 text-[11px] text-muted-foreground text-center">
                + još {unpaidLessons.length - 10} starijih
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div>
          <div className="px-5 py-2.5 bg-secondary/30 flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
              <Receipt className="size-3" strokeWidth={2.25} />
              Uplate ({payments.length})
            </p>
            <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 tabular-nums">
              {formatRsd(paidTotal)}
            </p>
          </div>
          <ul className="divide-y divide-border">
            {payments.slice(0, 8).map((p) => {
              const dt = new Date(p.paid_at);
              return (
                <li
                  key={p.id}
                  className="px-5 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                    />
                    <span className="text-foreground/90 tabular-nums font-medium">
                      {format(dt, "d. MMM yyyy.", { locale: srLatn })}
                    </span>
                    {p.note && (
                      <span className="text-muted-foreground/70 truncate max-w-[160px]">
                        · {p.note}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatRsd(p.amount)}
                  </span>
                </li>
              );
            })}
            {payments.length > 8 && (
              <li className="px-5 py-2 text-[11px] text-muted-foreground text-center">
                + još {payments.length - 8} starijih
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
