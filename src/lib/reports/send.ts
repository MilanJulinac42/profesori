import type { SupabaseClient } from "@supabase/supabase-js";
import { getResend, getResendFromEmail } from "@/lib/ai/resend";
import type { Student } from "@/lib/students/types";
import {
  renderReportHtml,
  renderReportPlainText,
  renderReportShareText,
} from "./render";
import type { ReportData } from "./types";

export type SendOutcome =
  | {
      ok: true;
      logId: string;
      resendMessageId: string | null;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Pošalje izveštaj preko Resend-a i upiše red u report_logs.
 * Ako je `previewOnly: true`, samo upiše log sa status='preview' (bez slanja).
 */
export async function sendReport(
  supabase: SupabaseClient,
  data: ReportData,
  student: Student,
  options: { previewOnly?: boolean } = {},
): Promise<SendOutcome> {
  const { subject, html } = renderReportHtml(data);
  const text = renderReportPlainText(data);

  const recipient = pickRecipient(student, data.audience);
  if (!recipient) {
    return {
      ok: false,
      error:
        data.audience === "parent"
          ? "Roditelj nema unet email — dodaj ga na profilu učenika."
          : "Učenik nema unet email — dodaj ga na profilu.",
    };
  }

  let resendMessageId: string | null = null;
  let status: "sent" | "failed" | "preview" = options.previewOnly
    ? "preview"
    : "sent";
  let errorMessage: string | null = null;

  if (!options.previewOnly) {
    try {
      const resend = getResend();
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to: recipient,
        subject,
        html,
        text,
      });
      if (result.error) {
        status = "failed";
        errorMessage = result.error.message ?? "Resend greška";
      } else {
        resendMessageId = result.data?.id ?? null;
      }
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : "Nepoznata greška.";
    }
  }

  // Upiši log bez obzira na ishod (ako je 'failed', vidi se u istoriji).
  const { data: logRow, error: logError } = await supabase
    .from("report_logs")
    .insert({
      organization_id: student.organization_id,
      student_id: student.id,
      kind: data.kind,
      audience: data.audience,
      period_start: data.periodStart.toISOString().slice(0, 10),
      period_end: data.periodEnd.toISOString().slice(0, 10),
      recipient_email: recipient,
      resend_message_id: resendMessageId,
      status,
      error_message: errorMessage,
      subject,
      html_body: html,
      data_snapshot: serializeReportData(data),
      ai_input_tokens: data.aiInputTokens,
      ai_output_tokens: data.aiOutputTokens,
    })
    .select("id")
    .single();

  if (logError) {
    return {
      ok: false,
      error: `Slanje je ${status === "sent" ? "uspelo" : "neuspelo"} ali log nije upisan: ${logError.message}`,
    };
  }

  if (status === "failed") {
    return { ok: false, error: errorMessage ?? "Slanje neuspešno." };
  }

  return { ok: true, logId: logRow.id, resendMessageId };
}

function pickRecipient(student: Student, audience: "parent" | "student"): string | null {
  if (audience === "student") {
    return student.student_email?.trim() || null;
  }
  return student.parent_email?.trim() || null;
}

function serializeReportData(data: ReportData): Record<string, unknown> {
  return {
    kind: data.kind,
    audience: data.audience,
    studentName: data.studentName,
    studentGrade: data.studentGrade,
    periodStart: data.periodStart.toISOString(),
    periodEnd: data.periodEnd.toISOString(),
    periodLabel: data.periodLabel,
    lessonsHeld: data.lessonsHeld,
    lessonsCancelled: data.lessonsCancelled,
    totalMinutes: data.totalMinutes,
    topTopics: data.topTopics,
    avgRating: data.avgRating,
    nextLessonPlan: data.nextLessonPlan,
    paidThisPeriod: data.paidThisPeriod,
    totalDebtNow: data.totalDebtNow,
    aiIntro: data.aiIntro,
    lessonsCount: data.lessons.length,
    // Cache-uj WhatsApp share text za istoriju — bez ovog bi history row
    // morao da poziva server akciju ili da re-konstruiše tekst iz polja.
    shareText: renderReportShareText(data),
  };
}
