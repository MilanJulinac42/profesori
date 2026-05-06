"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { Student } from "@/lib/students/types";
import { generateReport } from "./generate";
import { sendReport, saveDraftReportLog } from "./send";
import { renderReportHtml, renderReportShareText } from "./render";
import { getReportPeriod, getPastReportPeriod } from "./period";
import { getReportLogForPeriod } from "./queries";
import type { ReportKind } from "./types";

export type PreviewScope = "current" | "past";

export type PreviewResult =
  | {
      ok: true;
      html: string;
      subject: string;
      shareText: string;
      cached: boolean;
    }
  | { ok: false; error: string };

/**
 * Preview izveštaja sa keš provjerom.
 *
 * Tok:
 *   1. Izračunaj period (current = ova nedelja/mesec; past = prošla).
 *   2. Pogledaj postoji li već red u report_logs za (student, kind, period).
 *   3. Ako da i `forceRegenerate=false` → vrati keširan HTML (bez Anthropic poziva).
 *   4. Inače → generiši, upiši draft, vrati html.
 */
export async function previewReportAction(
  studentId: string,
  kind: ReportKind,
  scope: PreviewScope = "current",
  forceRegenerate = false,
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

    const period =
      scope === "past" ? getPastReportPeriod(kind) : getReportPeriod(kind);

    // 1. Cache check
    if (!forceRegenerate) {
      const existing = await getReportLogForPeriod(
        supabase,
        studentId,
        kind,
        period.start,
      );
      if (existing && existing.html_body) {
        const shareText =
          typeof existing.data_snapshot?.shareText === "string"
            ? (existing.data_snapshot.shareText as string)
            : "";
        return {
          ok: true,
          html: existing.html_body,
          subject: existing.subject,
          shareText,
          cached: true,
        };
      }
    }

    // 2. Generiši + upiši kao draft
    const data = await generateReport(supabase, {
      kind,
      student: s,
      teacherName: profile.full_name ?? "Profesor",
      anchor: period.start,
    });

    const draftRes = await saveDraftReportLog(supabase, data, s);
    if (!draftRes.ok) return { ok: false, error: draftRes.error };

    const { html, subject } = renderReportHtml(data);
    const shareText = renderReportShareText(data);

    revalidatePath(`/students/${studentId}`);

    return { ok: true, html, subject, shareText, cached: false };
  } catch (err) {
    const msg = friendlyAiError(err, "Greška u generisanju.");
    return { ok: false, error: msg };
  }
}

function friendlyAiError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/529|overloaded/i.test(raw)) {
    return "Anthropic API je trenutno preopterećen. Pokušaj ponovo za par sekundi.";
  }
  if (/rate.?limit|429/i.test(raw)) {
    return "Previše zahteva trenutno. Sačekaj 30 sekundi pa probaj ponovo.";
  }
  return raw || fallback;
}

export type SendResult =
  | { ok: true; logId: string; recipient: string }
  | { ok: false; error: string };

/**
 * Pošalje izveštaj. Koristi keširanu draft verziju ako postoji za ovaj period
 * (ne troši Anthropic ponovo). Ako draft ne postoji, generiše svež.
 */
export async function sendReportAction(
  studentId: string,
  kind: ReportKind,
  scope: PreviewScope = "current",
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

    const period =
      scope === "past" ? getPastReportPeriod(kind) : getReportPeriod(kind);

    // Generišemo SVEŽU verziju da bi sadržaj odražavao trenutno stanje
    // beleški/duga. (Cache je samo za Pregled; slanje je terminalna akcija.)
    const data = await generateReport(supabase, {
      kind,
      student: s,
      teacherName: profile.full_name ?? "Profesor",
      anchor: period.start,
    });

    const outcome = await sendReport(supabase, data, s);
    if (!outcome.ok) return { ok: false, error: outcome.error };

    const recipient =
      data.audience === "parent" ? s.parent_email! : s.student_email!;

    revalidatePath(`/students/${studentId}`);

    return { ok: true, logId: outcome.logId, recipient };
  } catch (err) {
    const msg = friendlyAiError(err, "Greška u slanju.");
    return { ok: false, error: msg };
  }
}
