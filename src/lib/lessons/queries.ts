import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the most-used topics across the org's lessons, sorted by frequency.
 */
export async function getRecentTopics(
  supabase: SupabaseClient,
  limit = 30,
): Promise<string[]> {
  const { data } = await supabase
    .from("lessons")
    .select("topics_covered, scheduled_at")
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(200);

  const counts = new Map<string, number>();
  for (const row of (data as { topics_covered: string[] | null }[] | null) ?? []) {
    for (const t of row.topics_covered ?? []) {
      const key = t.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}

/**
 * Count of completed lessons that are missing notes (notes_after_lesson empty).
 */
export async function countLessonsMissingNotes(
  supabase: SupabaseClient,
): Promise<number> {
  const { count } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("status", "completed")
    .or("notes_after_lesson.is.null,notes_after_lesson.eq.");
  return count ?? 0;
}
