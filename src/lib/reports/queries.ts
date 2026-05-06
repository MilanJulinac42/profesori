import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportKind, ReportLog } from "./types";

export async function listReportLogs(
  supabase: SupabaseClient,
  studentId: string,
  limit = 12,
): Promise<ReportLog[]> {
  const { data } = await supabase
    .from("report_logs")
    .select("*")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data as ReportLog[] | null) ?? [];
}

/**
 * Vraća postojeći log (draft ili sent) za tačan period.
 * Koristi se za cache check pre generisanja novog izveštaja.
 */
export async function getReportLogForPeriod(
  supabase: SupabaseClient,
  studentId: string,
  kind: ReportKind,
  periodStart: Date,
): Promise<ReportLog | null> {
  const { data } = await supabase
    .from("report_logs")
    .select("*")
    .eq("student_id", studentId)
    .eq("kind", kind)
    .eq("period_start", periodStart.toISOString().slice(0, 10))
    .maybeSingle();
  return (data as ReportLog | null) ?? null;
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
