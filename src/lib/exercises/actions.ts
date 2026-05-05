"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateExerciseSet } from "./generate";
import type { Difficulty } from "./types";
import { COUNT_OPTIONS } from "./types";

export type GenerateFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<string, string>>;
      preview?: {
        title: string;
        gradeLevel: string;
        topic: string;
        difficulty: Difficulty;
        teacherNotes: string;
        exercises: { question: string; solution: string; explanation: string }[];
        promptUsed: string;
        usage: {
          inputTokens: number;
          outputTokens: number;
          cacheReadTokens: number;
          cacheCreationTokens: number;
        };
      };
    }
  | undefined;

const DIFFICULTY_VALUES: Difficulty[] = ["lako", "srednje", "tesko", "mesano"];

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
 * Step 1: korisnik je kliknuo "Generiši". Pozivamo Claude API i vraćamo
 * preview u state. NE upisujemo u bazu dok korisnik ne klikne "Sačuvaj".
 */
export async function generateExerciseSetAction(
  _prev: GenerateFormState,
  formData: FormData,
): Promise<GenerateFormState> {
  const gradeLevel = String(formData.get("grade_level") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "").trim() as Difficulty;
  const countRaw = String(formData.get("count") ?? "").trim();
  const teacherNotes = String(formData.get("teacher_notes") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!gradeLevel) fieldErrors.grade_level = "Razred je obavezan.";
  if (!topic) fieldErrors.topic = "Tema je obavezna.";
  if (!DIFFICULTY_VALUES.includes(difficulty))
    fieldErrors.difficulty = "Izaberi težinu.";

  const count = Number(countRaw);
  if (!Number.isFinite(count) || !COUNT_OPTIONS.includes(count as 5 | 10 | 15 | 20)) {
    fieldErrors.count = "Izaberi broj zadataka.";
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  try {
    const result = await generateExerciseSet({
      gradeLevel,
      topic,
      difficulty,
      count,
      teacherNotes: teacherNotes || undefined,
    });

    return {
      preview: {
        title: result.title,
        gradeLevel,
        topic,
        difficulty,
        teacherNotes,
        exercises: result.exercises,
        promptUsed: result.promptUsed,
        usage: result.usage,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška pri generisanju.";
    return { error: msg };
  }
}

/**
 * Step 2: korisnik je kliknuo "Sačuvaj u banku" sa preview-om u hidden polju.
 * Upisujemo u bazu i redirect na detail.
 */
export async function saveExerciseSetAction(formData: FormData): Promise<void> {
  const payloadRaw = String(formData.get("payload") ?? "");
  if (!payloadRaw) throw new Error("Nedostaje payload.");

  const payload = JSON.parse(payloadRaw) as {
    title: string;
    gradeLevel: string;
    topic: string;
    difficulty: Difficulty;
    teacherNotes: string;
    exercises: { question: string; solution: string; explanation: string }[];
    promptUsed: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheCreationTokens: number;
    };
  };

  const { supabase, orgId } = await getOrgId();
  if (!orgId) throw new Error("Niste prijavljeni.");

  const { data, error } = await supabase
    .from("exercise_sets")
    .insert({
      organization_id: orgId,
      title: payload.title,
      subject: "matematika",
      grade_level: payload.gradeLevel,
      topic: payload.topic,
      difficulty: payload.difficulty,
      count: payload.exercises.length,
      teacher_notes: payload.teacherNotes || null,
      prompt_used: payload.promptUsed,
      exercises: payload.exercises,
      input_tokens: payload.usage.inputTokens,
      output_tokens: payload.usage.outputTokens,
      cache_read_tokens: payload.usage.cacheReadTokens,
      cache_creation_tokens: payload.usage.cacheCreationTokens,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/exercises");
  redirect(`/exercises/${data.id}`);
}

export async function deleteExerciseSet(id: string): Promise<void> {
  const { supabase } = await getOrgId();

  const { error } = await supabase
    .from("exercise_sets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/exercises");
  redirect("/exercises");
}
