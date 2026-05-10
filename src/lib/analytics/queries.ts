import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
} from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AnalyticsPeriod = "week" | "month" | "all";

export const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  week: "Ova nedelja",
  month: "Ovaj mesec",
  all: "Sve vreme",
};

export const PERIOD_OPTIONS: AnalyticsPeriod[] = ["week", "month", "all"];

export function getRangeForPeriod(period: AnalyticsPeriod): {
  from: Date;
  to: Date;
} {
  const now = new Date();
  switch (period) {
    case "week":
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "all":
      return { from: new Date("1970-01-01"), to: now };
  }
}

export type Analytics = {
  held: number;
  scheduled: number;
  cancelledByStudent: number;
  cancelledByTeacher: number;
  noShow: number;
  totalCancelled: number;
  revenue: number; // paras
  lostRevenue: number; // paras (cancelled_by_student + no_show)
  averageRevenuePerHeld: number; // paras
  cancellationRate: number; // 0..100
  totalLessonsTouched: number;
  topStudents: { id: string; name: string; revenue: number; lessons: number }[];
  /** Previous period comparison — same shape on key fields, used for trends. */
  previous?: {
    revenue: number;
    held: number;
    totalCancelled: number;
    cancellationRate: number;
  };
  /** Time-series across the active period — for sparklines / area chart / heatmap.
      Granularity ("daily" | "weekly") depends on period span. */
  series?: {
    label: string; // short date label "1. mar"
    iso: string; // ISO date (start of bucket)
    revenue: number; // paras
    held: number;
    cancelled: number;
  }[];
  /** Granularity of `series` — affects how heatmap renders. */
  seriesGranularity?: "daily" | "weekly";
};

/** Returns the previous range with the same length as `range`. */
export function getPreviousRange(
  range: { from: Date; to: Date },
  period: AnalyticsPeriod,
): { from: Date; to: Date } {
  switch (period) {
    case "week":
      return {
        from: subWeeks(range.from, 1),
        to: subWeeks(range.to, 1),
      };
    case "month":
      return {
        from: subMonths(range.from, 1),
        to: subMonths(range.to, 1),
      };
    case "all":
      return range;
  }
}

export function pctDelta(current: number, previous: number): number {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

type LessonRow = {
  status: string;
  price: number;
  scheduled_at: string;
  student_id: string;
  students: { full_name: string } | null;
};

type Aggregates = {
  held: number;
  scheduled: number;
  cancelledByStudent: number;
  cancelledByTeacher: number;
  noShow: number;
  revenue: number;
  lostRevenue: number;
  byStudent: Record<
    string,
    { id: string; name: string; revenue: number; lessons: number }
  >;
};

function aggregate(lessons: LessonRow[]): Aggregates {
  const a: Aggregates = {
    held: 0,
    scheduled: 0,
    cancelledByStudent: 0,
    cancelledByTeacher: 0,
    noShow: 0,
    revenue: 0,
    lostRevenue: 0,
    byStudent: {},
  };

  for (const l of lessons) {
    switch (l.status) {
      case "completed": {
        a.held++;
        a.revenue += l.price;
        const sid = l.student_id;
        const name = l.students?.full_name ?? "Učenik";
        if (!a.byStudent[sid])
          a.byStudent[sid] = { id: sid, name, revenue: 0, lessons: 0 };
        a.byStudent[sid].revenue += l.price;
        a.byStudent[sid].lessons++;
        break;
      }
      case "cancelled_by_student":
        a.cancelledByStudent++;
        a.lostRevenue += l.price;
        break;
      case "cancelled_by_teacher":
        a.cancelledByTeacher++;
        break;
      case "no_show":
        a.noShow++;
        a.lostRevenue += l.price;
        break;
      case "scheduled":
        a.scheduled++;
        break;
    }
  }
  return a;
}

async function fetchLessons(
  supabase: SupabaseClient,
  range: { from: Date; to: Date },
): Promise<LessonRow[]> {
  const { data } = await supabase
    .from("lessons")
    .select("status, price, scheduled_at, student_id, students(full_name)")
    .is("deleted_at", null)
    .gte("scheduled_at", range.from.toISOString())
    .lte("scheduled_at", range.to.toISOString());
  return (data as LessonRow[] | null) ?? [];
}

function buildSeries(
  lessons: LessonRow[],
  range: { from: Date; to: Date },
): {
  series: NonNullable<Analytics["series"]>;
  granularity: NonNullable<Analytics["seriesGranularity"]>;
} {
  // Find the actual data range: clamp `from` to first-lesson date when the
  // configured range starts at epoch ("all time"), so we don't render years
  // of empty cells.
  let from = range.from;
  if (lessons.length > 0) {
    const earliest = lessons.reduce((min, l) => {
      const t = new Date(l.scheduled_at).getTime();
      return t < min ? t : min;
    }, Date.now());
    if (earliest > from.getTime()) from = new Date(earliest);
  }

  const days = differenceInCalendarDays(range.to, from);

  // Switch to weekly buckets for ranges longer than 60 days.
  if (days > 60) {
    const weeks = eachWeekOfInterval(
      { start: from, end: range.to },
      { weekStartsOn: 1 },
    );
    // Cap to last 30 weeks for visual density
    const recentWeeks = weeks.slice(-30);
    const buckets: Record<
      string,
      { revenue: number; held: number; cancelled: number }
    > = {};
    for (const w of recentWeeks) {
      buckets[format(w, "yyyy-MM-dd")] = { revenue: 0, held: 0, cancelled: 0 };
    }
    for (const l of lessons) {
      const ws = startOfWeek(new Date(l.scheduled_at), { weekStartsOn: 1 });
      const key = format(ws, "yyyy-MM-dd");
      const b = buckets[key];
      if (!b) continue;
      if (l.status === "completed") {
        b.held++;
        b.revenue += l.price;
      } else if (
        l.status === "cancelled_by_student" ||
        l.status === "cancelled_by_teacher" ||
        l.status === "no_show"
      ) {
        b.cancelled++;
      }
    }
    return {
      granularity: "weekly",
      series: recentWeeks.map((w) => {
        const key = format(w, "yyyy-MM-dd");
        const b = buckets[key];
        return {
          label: format(w, "d. MMM"),
          iso: key,
          revenue: b.revenue,
          held: b.held,
          cancelled: b.cancelled,
        };
      }),
    };
  }

  // Daily buckets for shorter ranges
  const dayList = eachDayOfInterval({ start: from, end: range.to });
  const buckets: Record<
    string,
    { revenue: number; held: number; cancelled: number }
  > = {};
  for (const d of dayList) {
    const key = format(d, "yyyy-MM-dd");
    buckets[key] = { revenue: 0, held: 0, cancelled: 0 };
  }
  for (const l of lessons) {
    const key = l.scheduled_at.slice(0, 10);
    const b = buckets[key];
    if (!b) continue;
    if (l.status === "completed") {
      b.held++;
      b.revenue += l.price;
    } else if (
      l.status === "cancelled_by_student" ||
      l.status === "cancelled_by_teacher" ||
      l.status === "no_show"
    ) {
      b.cancelled++;
    }
  }
  return {
    granularity: "daily",
    series: dayList.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const b = buckets[key];
      return {
        label: format(d, "d. MMM"),
        iso: key,
        revenue: b.revenue,
        held: b.held,
        cancelled: b.cancelled,
      };
    }),
  };
}

export async function getLessonAnalytics(
  supabase: SupabaseClient,
  range: { from: Date; to: Date },
  options: { period?: AnalyticsPeriod; includePrevious?: boolean } = {},
): Promise<Analytics> {
  const { period, includePrevious = true } = options;
  const lessons = await fetchLessons(supabase, range);
  const a = aggregate(lessons);

  const totalCancelled = a.cancelledByStudent + a.cancelledByTeacher + a.noShow;
  const totalLessonsTouched = a.held + totalCancelled;
  const cancellationRate =
    totalLessonsTouched > 0 ? (totalCancelled / totalLessonsTouched) * 100 : 0;
  const averageRevenuePerHeld = a.held > 0 ? Math.round(a.revenue / a.held) : 0;

  const topStudents = Object.values(a.byStudent)
    .sort((x, y) => y.revenue - x.revenue)
    .slice(0, 5);

  let previous: Analytics["previous"] | undefined;
  if (includePrevious && period && period !== "all") {
    const prevRange = getPreviousRange(range, period);
    const prevLessons = await fetchLessons(supabase, prevRange);
    const p = aggregate(prevLessons);
    const prevTotalCancelled =
      p.cancelledByStudent + p.cancelledByTeacher + p.noShow;
    const prevTouched = p.held + prevTotalCancelled;
    previous = {
      revenue: p.revenue,
      held: p.held,
      totalCancelled: prevTotalCancelled,
      cancellationRate:
        prevTouched > 0 ? (prevTotalCancelled / prevTouched) * 100 : 0,
    };
  }

  const { series, granularity } = buildSeries(lessons, range);

  return {
    held: a.held,
    scheduled: a.scheduled,
    cancelledByStudent: a.cancelledByStudent,
    cancelledByTeacher: a.cancelledByTeacher,
    noShow: a.noShow,
    totalCancelled,
    revenue: a.revenue,
    lostRevenue: a.lostRevenue,
    averageRevenuePerHeld,
    cancellationRate,
    totalLessonsTouched,
    topStudents,
    previous,
    series,
    seriesGranularity: granularity,
  };
}
