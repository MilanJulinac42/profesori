import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  parseISO,
  isValid,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { WeekView } from "./_components/week-view";
import type { LessonWithStudent } from "@/lib/lessons/types";

type Search = { week?: string };

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const requested = params.week ? parseISO(params.week) : new Date();
  const anchor = isValid(requested) ? requested : new Date();

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });

  const supabase = await createClient();

  const [{ data: lessons }, { data: students }] = await Promise.all([
    supabase
      .from("lessons")
      .select("*, students(id, full_name)")
      .is("deleted_at", null)
      .gte("scheduled_at", weekStart.toISOString())
      .lte("scheduled_at", addDays(weekEnd, 1).toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("students")
      .select(
        "id, full_name, default_price_per_lesson, default_lesson_duration_minutes, status",
      )
      .is("deleted_at", null)
      .order("full_name", { ascending: true }),
  ]);

  return (
    <WeekView
      weekStartISO={format(weekStart, "yyyy-MM-dd")}
      lessons={(lessons as LessonWithStudent[] | null) ?? []}
      students={
        (students as {
          id: string;
          full_name: string;
          default_price_per_lesson: number;
          default_lesson_duration_minutes: number;
          status: string;
        }[] | null) ?? []
      }
    />
  );
}
