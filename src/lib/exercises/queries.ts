import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Difficulty,
  ExerciseSet,
  ExerciseSetSummary,
} from "./types";

export type ListFilters = {
  q?: string;
  difficulty?: Difficulty;
};

export async function listExerciseSets(
  supabase: SupabaseClient,
  filters: ListFilters = {},
): Promise<ExerciseSetSummary[]> {
  let query = supabase
    .from("exercise_sets")
    .select("id, title, subject, grade_level, topic, difficulty, count, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`title.ilike.${term},topic.ilike.${term}`);
  }

  const { data } = await query;
  return (data as ExerciseSetSummary[] | null) ?? [];
}

export async function getExerciseSet(
  supabase: SupabaseClient,
  id: string,
): Promise<ExerciseSet | null> {
  const { data } = await supabase
    .from("exercise_sets")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as ExerciseSet | null) ?? null;
}

export async function countExerciseSets(
  supabase: SupabaseClient,
): Promise<number> {
  const { count } = await supabase
    .from("exercise_sets")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);
  return count ?? 0;
}
