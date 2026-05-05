"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { Student } from "@/lib/students/types";
import { generateReport } from "./generate";
import { sendReport } from "./send";
import { renderReportHtml, renderReportShareText } from "./render";
import { getPastReportPeriod } from "./period";
import type { ReportData, ReportKind } from "./types";

export type PreviewResult =
  | {
      ok: true;
      data: ReportData;
      html: string;
      subject: string;
      shareText: string;
    }
  | { ok: false; error: string };

/**
 * Generiše izveštaj i vraća HTML preview (BEZ slanja, BEZ upisa u log).
 * Koristi se da profesor vidi rezultat pre nego što klikne "Pošalji".
 */
export async function previewReportAction(
  studentId: string,
  kind: ReportKind,
  scope: "current" | "past" = "past",
): Promise<PreviewResult> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!student) return { ok: false, error: "Učenik nije pronađen." };
    const s = student as Student;

    const period = scope === "past" ? getPastReportPeriod(kind) : null;

    const data = await generateReport(supabase, {
      kind,
      student: s,
      teacherName: profile.full_name ?? "Profesor",
      anchor: period?.start,
    });

    const { html, subject } = renderReportHtml(data);
    const shareText = renderReportShareText(data);

    return { ok: true, data, html, subject, shareText };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška u generisanju.";
    return { ok: false, error: msg };
  }
}

export type SendResult =
  | { ok: true; logId: string; recipient: string }
  | { ok: false; error: string };

/**
 * Generiše + šalje izveštaj. Upisuje red u report_logs.
 */
export async function sendReportAction(
  studentId: string,
  kind: ReportKind,
  scope: "current" | "past" = "past",
): Promise<SendResult> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!student) return { ok: false, error: "Učenik nije pronađen." };
    const s = student as Student;

    const period = scope === "past" ? getPastReportPeriod(kind) : null;

    const data = await generateReport(supabase, {
      kind,
      student: s,
      teacherName: profile.full_name ?? "Profesor",
      anchor: period?.start,
    });

    const outcome = await sendReport(supabase, data, s);

    if (!outcome.ok) return { ok: false, error: outcome.error };

    const recipient =
      data.audience === "parent"
        ? s.parent_email!
        : s.student_email!;

    revalidatePath(`/students/${studentId}`);

    return { ok: true, logId: outcome.logId, recipient };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška u slanju.";
    return { ok: false, error: msg };
  }
}
