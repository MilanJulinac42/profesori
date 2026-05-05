import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportLog } from "./types";

export async function listReportLogs(
  supabase: SupabaseClient,
  studentId: string,
  limit = 12,
): Promise<ReportLog[]> {
  const { data } = await supabase
    .from("report_logs")
    .select("*")
    .eq("student_id", studentId)
    .order("sent_at", { ascending: false })
    .limit(limit);
  return (data as ReportLog[] | null) ?? [];
}

export async function getReportLog(
  supabase: SupabaseClient,
  id: string,
): Promise<ReportLog | null> {
  const { data } = await supabase
    .from("report_logs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as ReportLog | null) ?? null;
}
