"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRsdInput } from "@/lib/money";
import type { LessonStatus, RecurrenceFrequency } from "./types";
import {
  processNoteText,
  transcribeAndProcess,
  type LessonContext,
  type LessonDraft,
} from "./transcribe";

export type LessonFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
} | undefined;

async function getOrgId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, orgId: null as string | null };
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  return { supabase, orgId: profile?.organization_id ?? null };
}

/**
 * Returns a conflicting lesson if [start, start+duration) overlaps any other
 * scheduled lesson (excluding `excludeId` if provided).
 */
async function findConflict(
  supabase: SupabaseClient,
  start: Date,
  durationMinutes: number,
  excludeId: string | null = null,
): Promise<{ id: string; scheduled_at: string; duration_minutes: number } | null> {
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  // Pull a generous window (±12h) and filter precisely in JS.
  const windowStart = new Date(start.getTime() - 12 * 3600_000).toISOString();
  const windowEnd = new Date(end.getTime() + 12 * 3600_000).toISOString();

  let query = supabase
    .from("lessons")
    .select("id, scheduled_at, duration_minutes")
    .is("deleted_at", null)
    .eq("status", "scheduled")
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query;
  for (const l of data ?? []) {
    const lStart = new Date(l.scheduled_at);
    const lEnd = new Date(lStart.getTime() + l.duration_minutes * 60_000);
    if (lStart < end && start < lEnd) return l;
  }
  return null;
}

function formatConflictMessage(c: {
  scheduled_at: string;
  duration_minutes: number;
}) {
  const dt = new Date(c.scheduled_at);
  const time = dt.toLocaleTimeString("sr-Latn-RS", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = dt.toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "short",
  });
  return `Već imaš zakazan čas ${date} u ${time} (${c.duration_minutes} min). Izaberi drugo vreme.`;
}

export async function createLesson(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const studentId = String(formData.get("student_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const durationStr = String(formData.get("duration_minutes") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!studentId) fieldErrors.student_id = "Izaberi učenika.";
  if (!date) fieldErrors.date = "Datum je obavezan.";
  if (!time) fieldErrors.time = "Vreme je obavezno.";

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const scheduledAt = new Date(`${date}T${time}:00`);
  if (isNaN(scheduledAt.getTime())) {
    return { fieldErrors: { date: "Neispravan datum/vreme." } };
  }

  const { supabase, orgId } = await getOrgId();
  if (!orgId) return { error: "Niste prijavljeni." };

  // Pull student to fill defaults if needed.
  const { data: student } = await supabase
    .from("students")
    .select("default_price_per_lesson, default_lesson_duration_minutes")
    .eq("id", studentId)
    .single();
  if (!student) return { fieldErrors: { student_id: "Učenik nije pronađen." } };

  let duration = Number(durationStr);
  if (!durationStr || !Number.isFinite(duration) || duration <= 0) {
    duration = student.default_lesson_duration_minutes ?? 60;
  }

  let pricePara: number;
  if (priceRaw) {
    const parsed = parseRsdInput(priceRaw);
    if (parsed === null) return { fieldErrors: { price: "Cena mora biti broj." } };
    pricePara = parsed;
  } else {
    pricePara = student.default_price_per_lesson ?? 0;
  }

  const conflict = await findConflict(supabase, scheduledAt, duration);
  if (conflict) {
    return { fieldErrors: { time: formatConflictMessage(conflict) } };
  }

  const { error } = await supabase.from("lessons").insert({
    organization_id: orgId,
    student_id: studentId,
    scheduled_at: scheduledAt.toISOString(),
    duration_minutes: duration,
    price: pricePara,
    status: "scheduled",
  });

  if (error) return { error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath(`/students/${studentId}`);
  return undefined;
}

/* ---------- recurring ---------- */

export type RecurringResult =
  | {
      ok: true;
      created: number;
      skipped: { date: string; reason: string }[];
      groupId: string;
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Kreira seriju ponavljajućih časova. Conflict-detection se radi PER kandidata:
 * ako neki termin koliduje sa postojećim časom, on se preskače (vraća se u
 * `skipped`), ali ostali se kreiraju.
 *
 * Svi kreirani časovi dele isti `recurrence_group_id` da bi se kasnije mogli
 * brisati/menjati kao grupa.
 */
export async function createRecurringLessons(input: {
  studentId: string;
  date: string; // "YYYY-MM-DD" prvog časa
  time: string; // "HH:MM"
  durationMinutes: number;
  priceRaw: string; // user input; ako prazno, koristi default učenika
  frequency: RecurrenceFrequency;
  count: number; // ukupno časova (uključujući prvi)
}): Promise<RecurringResult> {
  const fieldErrors: Record<string, string> = {};
  if (!input.studentId) fieldErrors.student_id = "Izaberi učenika.";
  if (!input.date) fieldErrors.date = "Datum je obavezan.";
  if (!input.time) fieldErrors.time = "Vreme je obavezno.";
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    fieldErrors.duration_minutes = "Trajanje mora biti broj veći od 0.";
  }
  if (!Number.isFinite(input.count) || input.count < 2 || input.count > 52) {
    fieldErrors.count = "Broj časova mora biti između 2 i 52.";
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Proveri polja.", fieldErrors };
  }

  const baseDate = new Date(`${input.date}T${input.time}:00`);
  if (isNaN(baseDate.getTime())) {
    return {
      ok: false,
      error: "Neispravan datum/vreme.",
      fieldErrors: { date: "Neispravan datum/vreme." },
    };
  }

  const { supabase, orgId } = await getOrgId();
  if (!orgId) return { ok: false, error: "Niste prijavljeni." };

  // Pull student da znamo defaults.
  const { data: student } = await supabase
    .from("students")
    .select("default_price_per_lesson, default_lesson_duration_minutes")
    .eq("id", input.studentId)
    .single();
  if (!student) {
    return {
      ok: false,
      error: "Učenik nije pronađen.",
      fieldErrors: { student_id: "Učenik nije pronađen." },
    };
  }

  let pricePara = student.default_price_per_lesson ?? 0;
  if (input.priceRaw && input.priceRaw.trim()) {
    const parsed = parseRsdInput(input.priceRaw);
    if (parsed === null) {
      return {
        ok: false,
        error: "Cena mora biti broj.",
        fieldErrors: { price: "Cena mora biti broj." },
      };
    }
    pricePara = parsed;
  }

  const intervalDays = input.frequency === "weekly" ? 7 : 14;
  const groupId = crypto.randomUUID();

  const toInsert: {
    organization_id: string;
    student_id: string;
    scheduled_at: string;
    duration_minutes: number;
    price: number;
    status: "scheduled";
    recurrence_group_id: string;
  }[] = [];
  const skipped: { date: string; reason: string }[] = [];

  for (let i = 0; i < input.count; i++) {
    const candidate = new Date(baseDate.getTime());
    candidate.setDate(candidate.getDate() + i * intervalDays);
    const conflict = await findConflict(
      supabase,
      candidate,
      input.durationMinutes,
    );
    if (conflict) {
      skipped.push({
        date: candidate.toISOString(),
        reason: formatConflictMessage(conflict),
      });
      continue;
    }
    toInsert.push({
      organization_id: orgId,
      student_id: input.studentId,
      scheduled_at: candidate.toISOString(),
      duration_minutes: input.durationMinutes,
      price: pricePara,
      status: "scheduled",
      recurrence_group_id: groupId,
    });
  }

  if (toInsert.length === 0) {
    return {
      ok: false,
      error:
        "Svi termini koliduju sa postojećim časovima. Promeni vreme ili učestalost.",
    };
  }

  const { error } = await supabase.from("lessons").insert(toInsert);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath(`/students/${input.studentId}`);

  return {
    ok: true,
    created: toInsert.length,
    skipped,
    groupId,
  };
}

export async function updateLesson(
  lessonId: string,
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const durationStr = String(formData.get("duration_minutes") ?? "60").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  // Notes fields (all optional).
  const notesAfter = String(formData.get("notes_after_lesson") ?? "").trim() || null;
  const nextPlan = String(formData.get("next_lesson_plan") ?? "").trim() || null;
  const ratingRaw = String(formData.get("lesson_rating") ?? "").trim();
  const topicsJson = String(formData.get("topics_covered") ?? "").trim();
  const progressSummary =
    String(formData.get("progress_summary") ?? "").trim() || null;
  const voiceTranscriptRaw =
    String(formData.get("voice_transcript_raw") ?? "").trim() || null;

  let rating: number | null = null;
  if (ratingRaw) {
    const r = Number(ratingRaw);
    if (Number.isFinite(r) && r >= 1 && r <= 5) rating = Math.round(r);
  }

  let topics: string[] = [];
  if (topicsJson) {
    try {
      const parsed = JSON.parse(topicsJson);
      if (Array.isArray(parsed))
        topics = parsed
          .map((t) => String(t).trim())
          .filter((t) => t.length > 0)
          .slice(0, 30);
    } catch {
      // ignore
    }
  }

  const fieldErrors: Record<string, string> = {};
  if (!date) fieldErrors.date = "Datum je obavezan.";
  if (!time) fieldErrors.time = "Vreme je obavezno.";
  const duration = Number(durationStr);
  if (!Number.isFinite(duration) || duration <= 0) {
    fieldErrors.duration_minutes = "Trajanje mora biti broj veći od 0.";
  }
  let pricePara: number | null = null;
  if (priceRaw) {
    const parsed = parseRsdInput(priceRaw);
    if (parsed === null) fieldErrors.price = "Cena mora biti broj.";
    else pricePara = parsed;
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const scheduledAt = new Date(`${date}T${time}:00`);
  if (isNaN(scheduledAt.getTime())) {
    return { fieldErrors: { date: "Neispravan datum/vreme." } };
  }

  const { supabase } = await getOrgId();

  const conflict = await findConflict(supabase, scheduledAt, duration, lessonId);
  if (conflict) {
    return { fieldErrors: { time: formatConflictMessage(conflict) } };
  }

  const { data: existing } = await supabase
    .from("lessons")
    .select("student_id")
    .eq("id", lessonId)
    .single();

  const update: Record<string, unknown> = {
    scheduled_at: scheduledAt.toISOString(),
    duration_minutes: duration,
    notes_after_lesson: notesAfter,
    next_lesson_plan: nextPlan,
    lesson_rating: rating,
    topics_covered: topics,
    progress_summary: progressSummary,
    voice_transcript_raw: voiceTranscriptRaw,
  };
  if (pricePara !== null) update.price = pricePara;

  const { error } = await supabase.from("lessons").update(update).eq("id", lessonId);
  if (error) return { error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (existing?.student_id) revalidatePath(`/students/${existing.student_id}`);
  return undefined;
}

export async function setLessonStatus(lessonId: string, status: LessonStatus) {
  const { supabase } = await getOrgId();

  const { data: existing } = await supabase
    .from("lessons")
    .select("student_id")
    .eq("id", lessonId)
    .single();

  const { error } = await supabase
    .from("lessons")
    .update({ status })
    .eq("id", lessonId);
  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (existing?.student_id) revalidatePath(`/students/${existing.student_id}`);
}

/**
 * Pomoćna: vraća kontekst časa za AI cleanup (ime učenika, razred, trajanje, recentne teme).
 */
async function fetchLessonContext(
  supabase: SupabaseClient,
  lessonId: string,
): Promise<LessonContext | null> {
  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "duration_minutes, student_id, students(full_name, grade)",
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) return null;

  const studentsField = lesson.students as
    | { full_name: string; grade: string | null }
    | { full_name: string; grade: string | null }[]
    | null;
  const student = Array.isArray(studentsField) ? (studentsField[0] ?? null) : studentsField;

  // Poslednje teme istog učenika za kontinuitet.
  const { data: recent } = await supabase
    .from("lessons")
    .select("topics_covered")
    .eq("student_id", lesson.student_id)
    .eq("status", "completed")
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(5);

  const recentTopics = Array.from(
    new Set(
      (recent ?? [])
        .flatMap((r) => (r.topics_covered as string[] | null) ?? [])
        .filter(Boolean),
    ),
  );

  return {
    studentName: student?.full_name ?? "Učenik",
    studentGrade: student?.grade ?? null,
    durationMinutes: lesson.duration_minutes as number,
    recentTopics,
  };
}

export type DraftResult =
  | { ok: true; draft: LessonDraft; transcript: string | null }
  | { ok: false; error: string };

/**
 * Server action: prima audio FormData ili sirov tekst, vraća strukturisan draft
 * koji UI prikaže profesoru za pregled.
 */
export async function generateLessonDraft(
  formData: FormData,
): Promise<DraftResult> {
  try {
    const lessonId = String(formData.get("lesson_id") ?? "").trim();
    if (!lessonId) return { ok: false, error: "Nedostaje lesson_id." };

    const supabase = await createClient();
    const ctx = await fetchLessonContext(supabase, lessonId);
    if (!ctx) return { ok: false, error: "Čas nije pronađen." };

    const audioField = formData.get("audio");
    const typedField = String(formData.get("typed_text") ?? "").trim();

    if (audioField instanceof File && audioField.size > 0) {
      const { draft, transcript } = await transcribeAndProcess(audioField, ctx);
      return { ok: true, draft, transcript };
    }

    if (typedField) {
      const draft = await processNoteText(typedField, ctx);
      return { ok: true, draft, transcript: null };
    }

    return { ok: false, error: "Nema ni audija ni teksta." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška u obradi.";
    return { ok: false, error: msg };
  }
}

/**
 * Server action: čuva (eventualno editovan) draft na času.
 * Ako je status još "scheduled", postavlja na "completed".
 */
export async function saveLessonNotesFromDraft(
  lessonId: string,
  draft: LessonDraft & { transcript_raw?: string | null },
): Promise<{ error?: string }> {
  const { supabase } = await getOrgId();

  const { data: existing } = await supabase
    .from("lessons")
    .select("student_id, status")
    .eq("id", lessonId)
    .single();

  if (!existing) return { error: "Čas nije pronađen." };

  const update: Record<string, unknown> = {
    notes_after_lesson: draft.notes_after_lesson || null,
    topics_covered: draft.topics_covered ?? [],
    progress_summary: draft.progress_summary || null,
    next_lesson_plan: draft.next_lesson_plan || null,
    lesson_rating: draft.suggested_rating ?? null,
    voice_transcript_raw: draft.transcript_raw ?? null,
  };

  if (existing.status === "scheduled") {
    update.status = "completed";
  }

  const { error } = await supabase
    .from("lessons")
    .update(update)
    .eq("id", lessonId);

  if (error) return { error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (existing.student_id) revalidatePath(`/students/${existing.student_id}`);
  return {};
}

/**
 * Soft-delete sve časove iz iste recurrence grupe sa scheduled_at >=
 * scheduled_at zadatog časa. Korisno kad profesor klikne "Obriši sve buduće".
 */
export async function deleteFutureLessonsInGroup(
  lessonId: string,
): Promise<{ deleted: number; error?: string }> {
  const { supabase } = await getOrgId();

  const { data: anchor } = await supabase
    .from("lessons")
    .select("scheduled_at, recurrence_group_id, student_id")
    .eq("id", lessonId)
    .single();

  if (!anchor) return { deleted: 0, error: "Čas nije pronađen." };
  if (!anchor.recurrence_group_id)
    return { deleted: 0, error: "Ovaj čas nije deo serije." };

  const { data: deleted, error } = await supabase
    .from("lessons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("recurrence_group_id", anchor.recurrence_group_id)
    .gte("scheduled_at", anchor.scheduled_at)
    .is("deleted_at", null)
    .select("id");

  if (error) return { deleted: 0, error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (anchor.student_id) revalidatePath(`/students/${anchor.student_id}`);

  return { deleted: deleted?.length ?? 0 };
}

export async function deleteLesson(lessonId: string) {
  const { supabase } = await getOrgId();

  // Read student_id BEFORE we set deleted_at (after that, RLS hides the row).
  const { data: existing } = await supabase
    .from("lessons")
    .select("student_id")
    .eq("id", lessonId)
    .single();

  const { error } = await supabase
    .from("lessons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (existing?.student_id) revalidatePath(`/students/${existing.student_id}`);
}
