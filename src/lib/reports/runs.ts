"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReport } from "./generate";
import { sendReport } from "./send";
import { getPastReportPeriod } from "./period";
import type { ReportKind } from "./types";
import type { Student } from "@/lib/students/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CronRunLog = {
  id: number;
  kind: ReportKind;
  source: "cron" | "manual";
  organization_id: string | null;
  started_at: string;
  finished_at: string | null;
  status: "running" | "ok" | "partial" | "failed";
  stats: {
    students_total?: number;
    sent?: number;
    skipped_already_sent?: number;
    skipped_no_email?: number;
    failed?: number;
  } | null;
  error: string | null;
};

/**
 * Recent cron + manual runs visible to the caller's org. Returns both the
 * org-scoped manual runs and the global cron runs (organization_id is null)
 * so the teacher can see when the system last fired for everyone.
 */
export async function listReportRuns(limit = 10): Promise<CronRunLog[]> {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("cron_run_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data as CronRunLog[] | null) ?? [];
}

export type ManualRunResult =
  | {
      ok: true;
      sent: number;
      failed: number;
      skippedAlreadySent: number;
      skippedNoEmail: number;
    }
  | { ok: false; error: string };

/**
 * Run weekly/monthly reports immediately for the caller's org only. Mirrors
 * the cron handler's per-org logic but uses the user's auth + writes a log
 * row with source="manual" so it shows up alongside scheduled runs.
 */
export async function runReportsManually(input: {
  kind: ReportKind;
}): Promise<ManualRunResult> {
  let logId: number | undefined;
  try {
    const { profile } = await requireUser();
    const orgId = profile.organization_id;
    const teacherName = profile.full_name ?? "Profesor";
    const admin = createAdminClient();

    // Open the run log (manual, scoped to this org).
    const { data: row } = await admin
      .from("cron_run_logs")
      .insert({
        kind: input.kind,
        source: "manual",
        organization_id: orgId,
        status: "running",
      })
      .select("id")
      .single();
    logId = (row as { id: number } | null)?.id;

    const flag =
      input.kind === "weekly"
        ? "weekly_reports_enabled"
        : "monthly_reports_enabled";
    const period = getPastReportPeriod(input.kind);
    const periodStartIso = period.start.toISOString().slice(0, 10);

    const { data: studentsData, error: stuErr } = await admin
      .from("students")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .eq(flag, true)
      .is("deleted_at", null);
    if (stuErr) {
      await finishLog(admin, logId, "failed", null, stuErr.message);
      return { ok: false, error: stuErr.message };
    }
    const students = (studentsData as Student[] | null) ?? [];

    // Idempotency: drop those already sent for this period.
    const studentIds = students.map((s) => s.id);
    let alreadySent = new Set<string>();
    if (studentIds.length > 0) {
      const { data: existingLogs } = await admin
        .from("report_logs")
        .select("student_id")
        .in("student_id", studentIds)
        .eq("kind", input.kind)
        .eq("period_start", periodStartIso)
        .eq("status", "sent");
      alreadySent = new Set(
        (existingLogs ?? []).map((l) => l.student_id as string),
      );
    }

    let sent = 0;
    let failed = 0;
    let skippedAlreadySent = 0;
    let skippedNoEmail = 0;
    const failures: { studentId: string; error: string }[] = [];

    for (const student of students) {
      if (alreadySent.has(student.id)) {
        skippedAlreadySent += 1;
        continue;
      }
      const recipient =
        student.report_audience === "parent"
          ? student.parent_email
          : student.student_email;
      if (!recipient || !recipient.trim()) {
        skippedNoEmail += 1;
        continue;
      }
      try {
        await sendOne(admin, student, input.kind, teacherName, period.start);
        sent += 1;
      } catch (err) {
        failed += 1;
        failures.push({
          studentId: student.id,
          error: err instanceof Error ? err.message : "Nepoznata greška",
        });
      }
    }

    const overall: "ok" | "partial" | "failed" =
      failed === 0 ? "ok" : sent === 0 ? "failed" : "partial";

    await finishLog(
      admin,
      logId,
      overall,
      {
        kind: input.kind,
        period_start: periodStartIso,
        students_total: students.length,
        sent,
        skipped_already_sent: skippedAlreadySent,
        skipped_no_email: skippedNoEmail,
        failed,
        failures,
      },
      null,
    );

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return {
      ok: true,
      sent,
      failed,
      skippedAlreadySent,
      skippedNoEmail,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Greška.";
    if (logId !== undefined) {
      const admin = createAdminClient();
      await finishLog(admin, logId, "failed", null, message);
    }
    return { ok: false, error: message };
  }
}

async function finishLog(
  admin: SupabaseClient,
  id: number | undefined,
  status: "ok" | "partial" | "failed",
  stats: Record<string, unknown> | null,
  error: string | null,
) {
  if (id === undefined) return;
  await admin
    .from("cron_run_logs")
    .update({
      finished_at: new Date().toISOString(),
      status,
      stats,
      error,
    })
    .eq("id", id);
}

async function sendOne(
  supabase: SupabaseClient,
  student: Student,
  kind: ReportKind,
  teacherName: string,
  anchor: Date,
) {
  const data = await generateReport(supabase, {
    kind,
    student,
    teacherName,
    anchor,
  });
  const outcome = await sendReport(supabase, data, student);
  if (!outcome.ok) throw new Error(outcome.error);
}
