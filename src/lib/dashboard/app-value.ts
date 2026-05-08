import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Statistika "šta je app uradio za profesora" za zadnji period — pokazuje
 * konkretnu vrednost (koliko izveštaja, koliko AI generacija, koliko
 * sačuvanih sati). Heuristike za time-saved su konzervativne, ali realne:
 *
 *  - Beleška sa časa (notes_after_lesson popunjen): ~5 min ušteđeno
 *    (vs ručno upisivanje u svesku)
 *  - Glasovna beleška (voice_transcript_raw popunjen): dodatno ~5 min
 *    (vs kucanje 100+ reči ručno)
 *  - AI generisan exercise set: ~30 min (vs traženje/pravljenje zadataka)
 *  - Poslat izveštaj roditelju: ~15 min (vs kucanje email-a)
 *  - Domaći zadat sa public linkom: ~5 min (vs WhatsApp foto + objašnjenje)
 *  - Domaći predat (status submitted/graded): ~3 min (vs ručno praćenje)
 */

export type AppValueStats = {
  periodDays: number;
  lessonsWithNotes: number;
  voiceTranscriptions: number;
  exerciseSetsGenerated: number;
  reportsSent: number;
  homeworkAssigned: number;
  homeworkSubmitted: number;
  totalMinutesSaved: number; // computed
};

export async function getAppValueStats(
  supabase: SupabaseClient,
  orgId: string,
  days = 7,
): Promise<AppValueStats> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const [
    { count: lessonsWithNotes },
    { count: voiceTranscriptions },
    { count: exerciseSetsGenerated },
    { count: reportsSent },
    { count: homeworkAssigned },
    { count: homeworkSubmitted },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .gte("updated_at", sinceIso)
      .not("notes_after_lesson", "is", null),
    supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .gte("updated_at", sinceIso)
      .not("voice_transcript_raw", "is", null),
    supabase
      .from("exercise_sets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .gte("created_at", sinceIso),
    supabase
      .from("report_logs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "sent")
      .gte("sent_at", sinceIso),
    supabase
      .from("homework")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .gte("created_at", sinceIso),
    supabase
      .from("homework")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .in("status", ["submitted", "graded"])
      .gte("submitted_at", sinceIso),
  ]);

  const lwn = lessonsWithNotes ?? 0;
  const vt = voiceTranscriptions ?? 0;
  const es = exerciseSetsGenerated ?? 0;
  const rs = reportsSent ?? 0;
  const ha = homeworkAssigned ?? 0;
  const hs = homeworkSubmitted ?? 0;

  const totalMinutesSaved =
    lwn * 5 + vt * 5 + es * 30 + rs * 15 + ha * 5 + hs * 3;

  return {
    periodDays: days,
    lessonsWithNotes: lwn,
    voiceTranscriptions: vt,
    exerciseSetsGenerated: es,
    reportsSent: rs,
    homeworkAssigned: ha,
    homeworkSubmitted: hs,
    totalMinutesSaved,
  };
}
