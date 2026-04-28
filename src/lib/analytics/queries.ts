import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AnalyticsPeriod = "week" | "month" | "30d" | "all";

export const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  week: "Ova nedelja",
  month: "Ovaj mesec",
  "30d": "Poslednjih 30 dana",
  all: "Sve vreme",
};

export const PERIOD_OPTIONS: AnalyticsPeriod[] = [
  "week",
  "month",
  "30d",
  "all",
];

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
    case "30d":
      return { from: subDays(now, 30), to: now };
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
};

export async function getLessonAnalytics(
  supabase: SupabaseClient,
  range: { from: Date; to: Date },
): Promise<Analytics> {
  const { data } = await supabase
    .from("lessons")
    .select("status, price, student_id, students(full_name)")
    .is("deleted_at", null)
    .gte("scheduled_at", range.from.toISOString())
    .lte("scheduled_at", range.to.toISOString());

  const lessons =
    (data as
      | {
          status: string;
          price: number;
          student_id: string;
          students: { full_name: string } | null;
        }[]
      | null) ?? [];

  let held = 0;
  let scheduled = 0;
  let cancelledByStudent = 0;
  let cancelledByTeacher = 0;
  let noShow = 0;
  let revenue = 0;
  let lostRevenue = 0;

  const byStudent: Record<
    string,
    { id: string; name: string; revenue: number; lessons: number }
  > = {};

  for (const l of lessons) {
    switch (l.status) {
      case "completed": {
        held++;
        revenue += l.price;
        const sid = l.student_id;
        const name = l.students?.full_name ?? "Učenik";
        if (!byStudent[sid])
          byStudent[sid] = { id: sid, name, revenue: 0, lessons: 0 };
        byStudent[sid].revenue += l.price;
        byStudent[sid].lessons++;
        break;
      }
      case "cancelled_by_student":
        cancelledByStudent++;
        lostRevenue += l.price;
        break;
      case "cancelled_by_teacher":
        cancelledByTeacher++;
        break;
      case "no_show":
        noShow++;
        lostRevenue += l.price;
        break;
      case "scheduled":
        scheduled++;
        break;
    }
  }

  const totalCancelled = cancelledByStudent + cancelledByTeacher + noShow;
  const totalLessonsTouched = held + totalCancelled;
  const cancellationRate =
    totalLessonsTouched > 0 ? (totalCancelled / totalLessonsTouched) * 100 : 0;
  const averageRevenuePerHeld = held > 0 ? Math.round(revenue / held) : 0;

  const topStudents = Object.values(byStudent)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    held,
    scheduled,
    cancelledByStudent,
    cancelledByTeacher,
    noShow,
    totalCancelled,
    revenue,
    lostRevenue,
    averageRevenuePerHeld,
    cancellationRate,
    totalLessonsTouched,
    topStudents,
  };
}
