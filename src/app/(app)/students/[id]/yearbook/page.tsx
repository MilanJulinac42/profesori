import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  startOfYear,
  endOfYear,
  format,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  startOfWeek,
} from "date-fns";
import { srLatn } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { computeBillableStatuses } from "@/lib/payments/types";
import { getOrgSettings } from "@/lib/settings/queries";
import { AutoPrint, PrintButton } from "@/components/auto-print";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/students/types";
import { YearPicker } from "./_components/year-picker";
import { MonthlyChart } from "./_components/monthly-chart";
import { getStudentPlan } from "@/lib/curriculum/queries";

type Search = { year?: string };

export default async function YearbookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const { year } = await searchParams;

  const supabase = await createClient();
  const { profile } = await requireUser();
  const teacherName = profile.full_name ?? "Profesor";

  const yr = year && /^\d{4}$/.test(year) ? parseInt(year) : new Date().getFullYear();
  const periodStart = startOfYear(new Date(yr, 0, 1));
  const periodEnd = endOfYear(new Date(yr, 0, 1));

  // Student
  const { data: studentRaw } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!studentRaw) notFound();
  const student = studentRaw as Student;

  const settings = await getOrgSettings(supabase, student.organization_id);
  const billableStatuses = computeBillableStatuses(settings);

  // Sve lessons u godini
  const { data: lessonsRaw } = await supabase
    .from("lessons")
    .select(
      "id, scheduled_at, duration_minutes, status, price, topics_covered, lesson_rating, progress_summary",
    )
    .eq("student_id", id)
    .is("deleted_at", null)
    .gte("scheduled_at", periodStart.toISOString())
    .lte("scheduled_at", periodEnd.toISOString())
    .order("scheduled_at", { ascending: true });

  const lessons = (lessonsRaw ?? []) as Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    price: number;
    topics_covered: string[] | null;
    lesson_rating: number | null;
    progress_summary: string | null;
  }>;

  const completed = lessons.filter((l) => l.status === "completed");
  const cancelled = lessons.filter(
    (l) =>
      l.status === "cancelled_by_student" ||
      l.status === "cancelled_by_teacher" ||
      l.status === "no_show",
  );
  const totalMinutes = completed.reduce((s, l) => s + l.duration_minutes, 0);
  const ratings = completed
    .map((l) => l.lesson_rating)
    .filter((r): r is number => r !== null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : null;

  // Top teme — frequency count
  const topicFreq = new Map<string, number>();
  for (const l of completed) {
    for (const t of l.topics_covered ?? []) {
      const key = t.trim();
      if (!key) continue;
      topicFreq.set(key, (topicFreq.get(key) ?? 0) + 1);
    }
  }
  const topTopics = Array.from(topicFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Per-mesec rasploženje
  const months = eachMonthOfInterval({ start: periodStart, end: periodEnd });
  const monthBreakdown = months.map((m) => {
    const monthStart = startOfMonth(m);
    const monthEnd = endOfMonth(m);
    const inMonth = lessons.filter((l) =>
      isWithinInterval(new Date(l.scheduled_at), {
        start: monthStart,
        end: monthEnd,
      }),
    );
    const monthCompleted = inMonth.filter((l) => l.status === "completed");
    const monthRatings = monthCompleted
      .map((l) => l.lesson_rating)
      .filter((r): r is number => r !== null);
    const monthAvg =
      monthRatings.length > 0
        ? monthRatings.reduce((s, r) => s + r, 0) / monthRatings.length
        : null;
    const monthTopics = new Set<string>();
    for (const l of monthCompleted) {
      for (const t of l.topics_covered ?? []) {
        if (t.trim()) monthTopics.add(t.trim());
      }
    }
    return {
      month: m,
      completedCount: monthCompleted.length,
      avgRating: monthAvg,
      topics: Array.from(monthTopics),
      progressSummaries: monthCompleted
        .map((l) => l.progress_summary)
        .filter((s): s is string => !!s && s.trim().length > 0),
    };
  });
  const monthsWithLessons = monthBreakdown.filter((m) => m.completedCount > 0);

  // Streak / consistency: count of distinct weeks with at least one completed
  // lesson, longest consecutive run of such weeks, longest gap.
  const weekKeys = new Set<string>();
  for (const l of completed) {
    const w = startOfWeek(new Date(l.scheduled_at), { weekStartsOn: 1 });
    weekKeys.add(w.toISOString().slice(0, 10));
  }
  const weeksActive = weekKeys.size;
  const totalWeeksInYear = 52;
  // Compute longest streak + longest gap over the year.
  let longestStreak = 0;
  let longestGap = 0;
  let curStreak = 0;
  let curGap = 0;
  const weekStart0 = startOfWeek(periodStart, { weekStartsOn: 1 });
  for (let w = 0; w < totalWeeksInYear; w++) {
    const wDate = new Date(weekStart0.getTime() + w * 7 * 86400000);
    // Skip weeks that fall outside the current year (start before, end after).
    const key = wDate.toISOString().slice(0, 10);
    if (weekKeys.has(key)) {
      curStreak += 1;
      curGap = 0;
      if (curStreak > longestStreak) longestStreak = curStreak;
    } else {
      curGap += 1;
      curStreak = 0;
      if (curGap > longestGap) longestGap = curGap;
    }
  }

  // Year-over-year comparison: fetch prior year's lessons + payments.
  const prevYr = yr - 1;
  const prevStart = startOfYear(new Date(prevYr, 0, 1));
  const prevEnd = endOfYear(new Date(prevYr, 0, 1));
  const { data: prevLessonsRaw } = await supabase
    .from("lessons")
    .select("status, duration_minutes, price, lesson_rating")
    .eq("student_id", id)
    .is("deleted_at", null)
    .gte("scheduled_at", prevStart.toISOString())
    .lte("scheduled_at", prevEnd.toISOString());
  const prevLessons = (prevLessonsRaw ?? []) as Array<{
    status: string;
    duration_minutes: number;
    price: number;
    lesson_rating: number | null;
  }>;
  const prevCompleted = prevLessons.filter((l) => l.status === "completed");
  const prevMinutes = prevCompleted.reduce(
    (s, l) => s + l.duration_minutes,
    0,
  );
  const prevRatings = prevCompleted
    .map((l) => l.lesson_rating)
    .filter((r): r is number => r !== null);
  const prevAvgRating =
    prevRatings.length > 0
      ? prevRatings.reduce((s, r) => s + r, 0) / prevRatings.length
      : null;
  const compare = {
    held: makeDelta(completed.length, prevCompleted.length),
    minutes: makeDelta(totalMinutes, prevMinutes),
    rating: avgRating !== null && prevAvgRating !== null
      ? makeDelta(avgRating, prevAvgRating)
      : null,
  };

  // Available years for the year picker — span first lesson year to current.
  const { data: oldestLesson } = await supabase
    .from("lessons")
    .select("scheduled_at")
    .eq("student_id", id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const firstYear = oldestLesson?.scheduled_at
    ? new Date(oldestLesson.scheduled_at).getFullYear()
    : yr;
  const availableYears = Array.from(
    { length: Math.max(1, new Date().getFullYear() - firstYear + 1) },
    (_, i) => firstYear + i,
  );

  // Monthly bar chart data (completed lessons per month).
  const monthlyCounts = monthBreakdown.map((m) => m.completedCount);
  const monthLabels = monthBreakdown.map((m) =>
    format(m.month, "LLL", { locale: srLatn })
      .replace(".", "")
      .slice(0, 3),
  );

  // Homework u godini
  const { data: hwRaw } = await supabase
    .from("homework")
    .select("id, title, status, created_at, due_date")
    .eq("student_id", id)
    .is("deleted_at", null)
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString())
    .order("created_at", { ascending: true });
  const homework = (hwRaw ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    due_date: string | null;
  }>;
  const hwTotal = homework.length;
  const hwSubmitted = homework.filter(
    (h) => h.status === "submitted" || h.status === "graded",
  ).length;

  // Payments u godini
  const { data: paymentsRaw } = await supabase
    .from("payments")
    .select("amount")
    .eq("student_id", id)
    .gte("paid_at", periodStart.toISOString())
    .lte("paid_at", periodEnd.toISOString());
  const totalPaid = (paymentsRaw ?? []).reduce(
    (s: number, p: { amount: number }) => s + p.amount,
    0,
  );
  const totalBillable = lessons
    .filter((l) => (billableStatuses as readonly string[]).includes(l.status))
    .reduce((s, l) => s + l.price, 0);

  // Plan učenja (curriculum) — godišnji presek aktivnih kurikuluma.
  const plan = await getStudentPlan(supabase, id);
  const startIso = periodStart.toISOString();
  const endIso = periodEnd.toISOString();
  const curriculumSummary = plan.active.map((a) => {
    const leaves = a.units.filter(
      (u) =>
        u.parent_unit_id !== null ||
        !a.units.some((c) => c.parent_unit_id === u.id),
    );
    const titleById = new Map(leaves.map((u) => [u.id, u.title]));
    const progressByUnit = new Map(a.progress.map((p) => [p.unit_id, p]));
    let mastered = 0;
    const masteredThisYear: string[] = [];
    const inProgressNow: string[] = [];
    for (const u of leaves) {
      const p = progressByUnit.get(u.id);
      if (!p) continue;
      if (p.status === "mastered") {
        mastered++;
        if (
          p.mastered_at &&
          p.mastered_at >= startIso &&
          p.mastered_at <= endIso
        ) {
          masteredThisYear.push(titleById.get(u.id) ?? u.title);
        }
      } else if (p.status === "in_progress") {
        inProgressNow.push(titleById.get(u.id) ?? u.title);
      }
    }
    const pct = leaves.length === 0 ? 0 : Math.round((mastered / leaves.length) * 100);
    return {
      id: a.curriculum.id,
      name: a.curriculum.name,
      subject: a.curriculum.subject,
      gradeLabel: a.curriculum.grade_label,
      pct,
      total: leaves.length,
      mastered,
      masteredThisYear,
      inProgressNow,
    };
  });

  return (
    <div className="bg-white text-black max-w-4xl mx-auto px-8 py-8 print:px-0 print:py-0 print:max-w-none">
      <AutoPrint />

      {/* Toolbar (samo screen) */}
      <div className="print:hidden mb-6 flex items-center justify-between gap-3 pb-4 border-b border-border flex-wrap">
        <Link
          href={`/students/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Nazad na profil
        </Link>
        <div className="flex items-center gap-2">
          <YearPicker
            studentId={id}
            current={yr}
            availableYears={availableYears}
          />
          <PrintButton />
        </div>
      </div>

      <article className="space-y-8">
        {/* Header */}
        <header className="space-y-2 pb-6 border-b-2 border-black">
          <p className="text-xs uppercase tracking-[0.15em] text-black/60">
            Godišnji dnevnik
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {student.full_name}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-black/70">
            {student.grade && <span>{student.grade}</span>}
            <span className="font-medium">Godina {yr}.</span>
            {student.parent_name && <span>Roditelj: {student.parent_name}</span>}
          </div>
        </header>

        {/* Statistika summary */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            label="Časova održano"
            value={completed.length.toString()}
            delta={compare.held}
          />
          <Stat
            label="Ukupno minuta"
            value={totalMinutes.toString()}
            sub={`${Math.round(totalMinutes / 60)}h`}
            delta={compare.minutes}
          />
          <Stat
            label="Prosečna ocena"
            value={avgRating !== null ? avgRating.toFixed(2) : "—"}
            sub={ratings.length > 0 ? `iz ${ratings.length} časova` : ""}
            delta={compare.rating}
          />
          <Stat
            label="Otkazanih / no-show"
            value={cancelled.length.toString()}
            sub={
              completed.length + cancelled.length > 0
                ? `${Math.round((completed.length / (completed.length + cancelled.length)) * 100)}% pohađanost`
                : ""
            }
          />
        </section>

        {/* Consistency / streak */}
        {weeksActive > 0 && (
          <section className="grid grid-cols-3 gap-3">
            <Stat
              label="Aktivnih nedelja"
              value={`${weeksActive} / 52`}
              sub={`${Math.round((weeksActive / 52) * 100)}% godine`}
            />
            <Stat
              label="Najduži niz"
              value={`${longestStreak}`}
              sub={
                longestStreak === 1
                  ? "1 uzastopna nedelja"
                  : `${longestStreak} uzastopnih nedelja`
              }
            />
            <Stat
              label="Najduža pauza"
              value={`${longestGap}`}
              sub={
                longestGap === 0
                  ? "bez pauza"
                  : longestGap === 1
                    ? "1 nedelja bez časa"
                    : `${longestGap} nedelja bez časa`
              }
            />
          </section>
        )}

        {/* Monthly bar chart */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.12em] text-black/60 mb-3">
              Časovi po mesecima
            </h2>
            <div className="rounded-lg border border-black/20 px-3 py-3">
              <MonthlyChart values={monthlyCounts} labels={monthLabels} />
            </div>
          </section>
        )}

        {/* Domaći + naplata */}
        <section className="grid sm:grid-cols-2 gap-3">
          <Stat
            label="Domaći zadati"
            value={hwTotal.toString()}
            sub={
              hwTotal > 0
                ? `${hwSubmitted} predato (${Math.round((hwSubmitted / hwTotal) * 100)}%)`
                : ""
            }
          />
          <Stat
            label="Plaćeno u godini"
            value={`${totalPaid.toLocaleString("sr-Latn-RS")} para`}
            sub={
              totalBillable > 0
                ? `od ${totalBillable.toLocaleString("sr-Latn-RS")} para naplativih`
                : ""
            }
          />
        </section>

        {/* Plan učenja (curriculum) */}
        {curriculumSummary.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="text-xs uppercase tracking-[0.12em] text-black/60 mb-3">
              Plan učenja
            </h2>
            <div className="space-y-3">
              {curriculumSummary.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-black/20 px-4 py-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-[11px] text-black/60">
                        {[c.subject, c.gradeLabel].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="text-sm tabular-nums">
                      <strong>{c.mastered}</strong>
                      <span className="text-black/50">/{c.total}</span>
                      <span className="text-black/50"> · {c.pct}%</span>
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className="h-full bg-black/70"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                  {c.masteredThisYear.length > 0 && (
                    <p className="mt-2 text-[12px] leading-relaxed">
                      <span className="font-semibold">Savladano u godini:</span>{" "}
                      {c.masteredThisYear.join(", ")}
                    </p>
                  )}
                  {c.inProgressNow.length > 0 && (
                    <p className="mt-1 text-[12px] leading-relaxed text-black/70">
                      <span className="font-semibold">U toku:</span>{" "}
                      {c.inProgressNow.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top teme */}
        {topTopics.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.12em] text-black/60 mb-3">
              Pokrivene teme (top 20 po zastupljenosti)
            </h2>
            <div className="flex flex-wrap gap-2">
              {topTopics.map(([topic, count]) => (
                <span
                  key={topic}
                  className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-full border border-black/20 text-sm"
                >
                  {topic}
                  <span className="text-[10px] tabular-nums text-black/50">
                    ×{count}
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Per-mesec breakdown */}
        {monthsWithLessons.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.12em] text-black/60 mb-4">
              Mesečni pregled
            </h2>
            <ol className="space-y-5">
              {monthsWithLessons.map((m) => (
                <li
                  key={m.month.toISOString()}
                  className="break-inside-avoid border-l-2 border-black/30 pl-4"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-base font-medium capitalize">
                      {format(m.month, "LLLL", { locale: srLatn })}
                    </h3>
                    <div className="text-xs text-black/60 inline-flex items-center gap-2">
                      <span>{m.completedCount} časova</span>
                      {m.avgRating !== null && (
                        <span className="inline-flex items-center gap-0.5">
                          <Star
                            className="size-3 fill-current"
                            strokeWidth={0}
                          />
                          {m.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {m.topics.length > 0 && (
                    <p className="text-xs text-black/60 mb-2">
                      <strong>Teme:</strong> {m.topics.join(", ")}
                    </p>
                  )}
                  {m.progressSummaries.length > 0 && (
                    <ul className="text-sm text-black/80 space-y-1.5 mt-2">
                      {m.progressSummaries.slice(0, 4).map((s, i) => (
                        <li key={i} className="leading-relaxed">
                          • {s}
                        </li>
                      ))}
                      {m.progressSummaries.length > 4 && (
                        <li className="text-xs text-black/50 italic">
                          (+ {m.progressSummaries.length - 4} dodatnih beleški)
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Domaći zadaci */}
        {homework.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="text-xs uppercase tracking-[0.12em] text-black/60 mb-3">
              Domaći zadaci ({homework.length})
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-black/20">
                  <th className="text-left py-2 font-medium">Datum</th>
                  <th className="text-left py-2 font-medium">Zadatak</th>
                  <th className="text-right py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {homework.map((h) => (
                  <tr key={h.id} className="border-b border-black/10">
                    <td className="py-2 tabular-nums text-black/70">
                      {format(new Date(h.created_at), "d. MMM", {
                        locale: srLatn,
                      })}
                    </td>
                    <td className="py-2">{h.title}</td>
                    <td className="py-2 text-right">
                      <span
                        className={cn(
                          "inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded",
                          h.status === "graded"
                            ? "bg-emerald-100 text-emerald-900"
                            : h.status === "submitted"
                              ? "bg-amber-100 text-amber-900"
                              : h.status === "skipped"
                                ? "bg-black/10 text-black/60"
                                : "bg-black/10 text-black/70",
                        )}
                      >
                        {h.status === "graded"
                          ? "Ocenjeno"
                          : h.status === "submitted"
                            ? "Predato"
                            : h.status === "skipped"
                              ? "Preskočeno"
                              : "Zadato"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Empty state ako ne postoji ništa */}
        {completed.length === 0 && homework.length === 0 && (
          <section className="rounded-lg border-2 border-dashed border-black/20 p-10 text-center">
            <p className="text-sm text-black/60">
              U {yr}. godini nema održanih časova ni zadatih domaćih za ovog
              učenika.
            </p>
          </section>
        )}

        {/* Footer */}
        <footer className="space-y-3 pt-6 border-t-2 border-black/20">
          <p className="text-[11px] text-black/60 leading-relaxed">
            Ovo je profesionalna evidencija rada profesora privatnih časova.
            Sve transakcije se obavljaju gotovinski, direktno između profesora
            i roditelja/učenika.
          </p>
          <div className="flex justify-between items-baseline pt-2">
            <p className="text-sm">
              <strong>{teacherName}</strong>
            </p>
            <p className="text-xs text-black/50 tabular-nums">
              Generisano:{" "}
              {format(new Date(), "d. MMM yyyy.", { locale: srLatn })}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { pct: number; direction: "up" | "down" | "flat" } | null;
}) {
  return (
    <div className="rounded-lg border border-black/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-black/60">
          {label}
        </div>
        {delta && <DeltaBadge delta={delta} />}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      {sub && <div className="text-[11px] text-black/60 mt-0.5">{sub}</div>}
    </div>
  );
}

function DeltaBadge({
  delta,
}: {
  delta: { pct: number; direction: "up" | "down" | "flat" };
}) {
  const Icon =
    delta.direction === "up"
      ? TrendingUp
      : delta.direction === "down"
        ? TrendingDown
        : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
        delta.direction === "up" && "bg-emerald-100 text-emerald-900",
        delta.direction === "down" && "bg-rose-100 text-rose-900",
        delta.direction === "flat" && "bg-black/10 text-black/60",
      )}
      title="Promena u odnosu na prošlu godinu"
    >
      <Icon className="size-2.5" strokeWidth={2.5} />
      {delta.direction === "flat"
        ? "0%"
        : `${delta.direction === "up" ? "+" : ""}${Math.round(delta.pct)}%`}
    </span>
  );
}

function makeDelta(
  curr: number,
  prev: number,
): { pct: number; direction: "up" | "down" | "flat" } | null {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return { pct: 100, direction: "up" };
  const pct = ((curr - prev) / prev) * 100;
  if (Math.abs(pct) < 1) return { pct: 0, direction: "flat" };
  return { pct, direction: pct > 0 ? "up" : "down" };
}
