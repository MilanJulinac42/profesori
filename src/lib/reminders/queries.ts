import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReminderLog } from "./types";

/**
 * Returns the most recent reminder log per student, keyed by student_id.
 */
export async function getLastReminderByStudent(
  supabase: SupabaseClient,
  studentIds: string[],
): Promise<Map<string, ReminderLog>> {
  if (studentIds.length === 0) return new Map();
  const { data } = await supabase
    .from("reminder_logs")
    .select("*")
    .in("student_id", studentIds)
    .order("sent_at", { ascending: false });

  const map = new Map<string, ReminderLog>();
  for (const log of (data as ReminderLog[] | null) ?? []) {
    if (!map.has(log.student_id)) map.set(log.student_id, log);
  }
  return map;
}

export async function getRemindersForStudent(
  supabase: SupabaseClient,
  studentId: string,
  limit = 10,
): Promise<ReminderLog[]> {
  const { data } = await supabase
    .from("reminder_logs")
    .select("*")
    .eq("student_id", studentId)
    .order("sent_at", { ascending: false })
    .limit(limit);
  return (data as ReminderLog[] | null) ?? [];
}
