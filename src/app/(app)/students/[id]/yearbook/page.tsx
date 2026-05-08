import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import {
  startOfYear,
  endOfYear,
  format,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { srLatn } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { computeBillableStatuses } from "@/lib/payments/types";
import { getOrgSettings } from "@/lib/settings/queries";
import { AutoPrint, PrintButton } from "@/components/auto-print";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/students/types";

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

  return (
    <div className="bg-white text-black max-w-4xl mx-auto px-8 py-8 print:px-0 print:py-0 print:max-w-none">
      <AutoPrint />

      {/* Toolbar (samo screen) */}
      <div className="print:hidden mb-6 flex items-center justify-between gap-3 pb-4 border-b border-border">
        <Link
          href={`/students/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Nazad na profil
        </Link>
        <PrintButton />
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
          <Stat label="Časova održano" value={completed.length.toString()} />
          <Stat
            label="Ukupno minuta"
            value={totalMinutes.toString()}
            sub={`${Math.round(totalMinutes / 60)}h`}
          />
          <Stat
            label="Prosečna ocena"
            value={avgRating !== null ? avgRating.toFixed(2) : "—"}
            sub={ratings.length > 0 ? `iz ${ratings.length} časova` : ""}
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
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-black/20 p-3">
      <div className="text-[10px] uppercase tracking-wider text-black/60">
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      {sub && <div className="text-[11px] text-black/60 mt-0.5">{sub}</div>}
    </div>
  );
}
