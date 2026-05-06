import type { SupabaseClient } from "@supabase/supabase-js";
import type { Homework, HomeworkStatus } from "./types";

export async function listHomeworkForStudent(
  supabase: SupabaseClient,
  studentId: string,
  limit = 20,
): Promise<Homework[]> {
  const { data } = await supabase
    .from("homework")
    .select("*")
    .eq("student_id", studentId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Homework[] | null) ?? [];
}

export async function listHomeworkForLesson(
  supabase: SupabaseClient,
  lessonId: string,
): Promise<Homework[]> {
  const { data } = await supabase
    .from("homework")
    .select("*")
    .eq("lesson_id", lessonId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data as Homework[] | null) ?? [];
}

export async function getHomework(
  supabase: SupabaseClient,
  id: string,
): Promise<Homework | null> {
  const { data } = await supabase
    .from("homework")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as Homework | null) ?? null;
}

/** Dashboard callout: koliko predatih domaćih čeka pregled. */
export async function countSubmittedHomework(
  supabase: SupabaseClient,
): Promise<number> {
  const { count } = await supabase
    .from("homework")
    .select("id", { count: "exact", head: true })
    .eq("status", "submitted")
    .is("deleted_at", null);
  return count ?? 0;
}

export async function listSubmittedHomework(
  supabase: SupabaseClient,
  limit = 10,
): Promise<(Homework & { student_name: string })[]> {
  const { data } = await supabase
    .from("homework")
    .select("*, students!inner(full_name)")
    .eq("status", "submitted")
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  return ((data as Array<Homework & { students: { full_name: string } }>) ?? []).map(
    (h) => ({
      ...h,
      student_name: h.students.full_name,
    }),
  );
}

/**
 * Statistika domaćih za period (za nedeljni/mesečni izveštaj).
 * Broji koliko je domaćih ZADATO (created_at u periodu) i koliko od njih
 * je predato/ocenjeno.
 */
export async function getHomeworkStatsForPeriod(
  supabase: SupabaseClient,
  studentId: string,
  start: Date,
  end: Date,
): Promise<{ assigned: number; submitted: number; graded: number }> {
  const { data } = await supabase
    .from("homework")
    .select("status")
    .eq("student_id", studentId)
    .is("deleted_at", null)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const rows = (data as { status: HomeworkStatus }[] | null) ?? [];
  return {
    assigned: rows.length,
    submitted: rows.filter((r) => r.status === "submitted" || r.status === "graded")
      .length,
    graded: rows.filter((r) => r.status === "graded").length,
  };
}
