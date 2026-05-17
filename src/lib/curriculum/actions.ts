"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { UnitStatus } from "./types";
import {
  listStudentPickableUnits,
  getLessonUnitIds,
  getLessonsForUnit,
  type StudentPickableUnit,
  type UnitLesson,
} from "./queries";

type Result<T = void> =
  | (T extends void ? { ok: true } : { ok: true } & T)
  | { ok: false; error: string };

/* ----------------------------------------------------------------------- */
/* Curriculum CRUD                                                          */
/* ----------------------------------------------------------------------- */

export async function createCurriculumAction(): Promise<void> {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("curricula")
    .insert({
      organization_id: profile.organization_id,
      subject: "",
      name: "Novi kurikulum",
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Greška pri kreiranju.");
  revalidatePath("/curricula");
  redirect(`/curricula/${data.id}`);
}

export type UpdateCurriculumInput = {
  id: string;
  name?: string;
  subject?: string;
  grade_label?: string | null;
  description?: string | null;
  is_active?: boolean;
};

export async function updateCurriculumAction(
  input: UpdateCurriculumInput,
): Promise<Result> {
  await requireUser();
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim() || "Bez imena";
  if (input.subject !== undefined) patch.subject = input.subject.trim();
  if (input.grade_label !== undefined)
    patch.grade_label = input.grade_label?.trim() || null;
  if (input.description !== undefined)
    patch.description = input.description?.trim() || null;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from("curricula").update(patch).eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/curricula/${input.id}`);
  revalidatePath("/curricula");
  return { ok: true };
}

export type CurriculumImpact = {
  assignedStudents: number;
  units: number;
};

export async function getCurriculumImpactAction(
  id: string,
): Promise<CurriculumImpact> {
  await requireUser();
  const supabase = await createClient();
  const [{ count: studentsCount }, { count: unitsCount }] = await Promise.all([
    supabase
      .from("student_curricula")
      .select("id", { count: "exact", head: true })
      .eq("curriculum_id", id)
      .is("ended_at", null),
    supabase
      .from("curriculum_units")
      .select("id", { count: "exact", head: true })
      .eq("curriculum_id", id),
  ]);
  return {
    assignedStudents: studentsCount ?? 0,
    units: unitsCount ?? 0,
  };
}

export type UnitImpact = {
  children: number;
  lessonsLinked: number;
};

export async function getUnitImpactAction(id: string): Promise<UnitImpact> {
  await requireUser();
  const supabase = await createClient();
  const [{ count: childrenCount }, { count: linksCount }] = await Promise.all([
    supabase
      .from("curriculum_units")
      .select("id", { count: "exact", head: true })
      .eq("parent_unit_id", id),
    supabase
      .from("lesson_units")
      .select("lesson_id", { count: "exact", head: true })
      .eq("unit_id", id),
  ]);
  return {
    children: childrenCount ?? 0,
    lessonsLinked: linksCount ?? 0,
  };
}

export async function softDeleteCurriculumAction(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("curricula")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/curricula");
  redirect("/curricula");
}

/* ----------------------------------------------------------------------- */
/* Unit CRUD                                                                */
/* ----------------------------------------------------------------------- */

export type AddUnitInput = {
  curriculumId: string;
  parentUnitId: string | null;
  title: string;
};

export async function addUnitAction(
  input: AddUnitInput,
): Promise<Result<{ unitId: string }>> {
  await requireUser();
  const supabase = await createClient();

  const sibsQuery = supabase
    .from("curriculum_units")
    .select("order_index")
    .eq("curriculum_id", input.curriculumId);
  const { data: sibs } =
    input.parentUnitId === null
      ? await sibsQuery.is("parent_unit_id", null)
      : await sibsQuery.eq("parent_unit_id", input.parentUnitId);

  const nextIndex =
    ((sibs as { order_index: number }[] | null) ?? []).reduce(
      (m, r) => Math.max(m, r.order_index),
      -1,
    ) + 1;

  const { data, error } = await supabase
    .from("curriculum_units")
    .insert({
      curriculum_id: input.curriculumId,
      parent_unit_id: input.parentUnitId,
      title: input.title.trim() || (input.parentUnitId ? "Nova podtema" : "Nova sekcija"),
      order_index: nextIndex,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Greška." };

  revalidatePath(`/curricula/${input.curriculumId}`);
  return { ok: true, unitId: data.id };
}

export type UpdateUnitInput = {
  id: string;
  title?: string;
  description?: string | null;
  est_lessons?: number | null;
};

export async function updateUnitAction(
  input: UpdateUnitInput,
): Promise<Result> {
  await requireUser();
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim() || "Bez naziva";
  if (input.description !== undefined)
    patch.description = input.description?.trim() || null;
  if (input.est_lessons !== undefined) patch.est_lessons = input.est_lessons;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { data: unit } = await supabase
    .from("curriculum_units")
    .select("curriculum_id")
    .eq("id", input.id)
    .maybeSingle();

  const { error } = await supabase
    .from("curriculum_units")
    .update(patch)
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  if (unit) revalidatePath(`/curricula/${unit.curriculum_id}`);
  return { ok: true };
}

export async function deleteUnitAction(id: string): Promise<Result> {
  await requireUser();
  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("curriculum_units")
    .select("curriculum_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("curriculum_units").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (unit) revalidatePath(`/curricula/${unit.curriculum_id}`);
  return { ok: true };
}

export async function reorderUnitsAction(
  curriculumId: string,
  items: { id: string; order_index: number }[],
): Promise<Result> {
  await requireUser();
  const supabase = await createClient();
  // Sequential updates — Supabase JS doesn't expose batch update with per-row values.
  for (const it of items) {
    const { error } = await supabase
      .from("curriculum_units")
      .update({ order_index: it.order_index })
      .eq("id", it.id);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/curricula/${curriculumId}`);
  return { ok: true };
}

/* ----------------------------------------------------------------------- */
/* Student assignment + progress                                            */
/* ----------------------------------------------------------------------- */

export async function assignCurriculumAction(
  studentId: string,
  curriculumId: string,
): Promise<Result<{ assignmentId: string }>> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_curricula")
    .insert({ student_id: studentId, curriculum_id: curriculumId })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Greška." };
  revalidatePath(`/students/${studentId}`);
  return { ok: true, assignmentId: data.id };
}

export async function unassignCurriculumAction(
  assignmentId: string,
  studentId: string,
): Promise<Result> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("student_curricula")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", assignmentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}

export type UpdateUnitStatusInput = {
  studentCurriculumId: string;
  unitId: string;
  status: UnitStatus;
  studentId: string;
  notes?: string;
};

export async function updateUnitStatusAction(
  input: UpdateUnitStatusInput,
): Promise<Result> {
  await requireUser();
  const supabase = await createClient();

  const patch: Record<string, unknown> = { status: input.status };
  if (input.status === "mastered") patch.mastered_at = new Date().toISOString();
  if (input.status !== "mastered") patch.mastered_at = null;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  // Upsert by (student_curriculum_id, unit_id).
  const { error } = await supabase
    .from("student_unit_progress")
    .upsert(
      {
        student_curriculum_id: input.studentCurriculumId,
        unit_id: input.unitId,
        ...patch,
      },
      { onConflict: "student_curriculum_id,unit_id" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/students/${input.studentId}`);
  return { ok: true };
}

/**
 * Server-action wrappers for client components to fetch picker data.
 */
export async function listStudentPickableUnitsAction(
  studentId: string,
): Promise<StudentPickableUnit[]> {
  await requireUser();
  const supabase = await createClient();
  return listStudentPickableUnits(supabase, studentId);
}

export async function getLessonUnitIdsAction(
  lessonId: string,
): Promise<string[]> {
  await requireUser();
  const supabase = await createClient();
  return getLessonUnitIds(supabase, lessonId);
}

export async function getLessonsForUnitAction(
  unitId: string,
  studentId: string,
): Promise<UnitLesson[]> {
  await requireUser();
  const supabase = await createClient();
  return getLessonsForUnit(supabase, unitId, studentId);
}

/**
 * Replace the lesson_units rows for a lesson. Delete old, insert new.
 * Returns the resolved unit IDs (for any callers that want to react).
 */
export async function setLessonUnitsAction(
  lessonId: string,
  unitIds: string[],
): Promise<Result<{ unitIds: string[] }>> {
  await requireUser();
  const supabase = await createClient();

  // Diff existing vs incoming to minimize churn.
  const { data: existing } = await supabase
    .from("lesson_units")
    .select("unit_id")
    .eq("lesson_id", lessonId);
  const have = new Set(
    ((existing as { unit_id: string }[] | null) ?? []).map((r) => r.unit_id),
  );
  const want = new Set(unitIds);

  const toRemove = [...have].filter((id) => !want.has(id));
  const toAdd = [...want].filter((id) => !have.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("lesson_units")
      .delete()
      .eq("lesson_id", lessonId)
      .in("unit_id", toRemove);
    if (error) return { ok: false, error: error.message };
  }
  if (toAdd.length > 0) {
    const rows = toAdd.map((unit_id) => ({ lesson_id: lessonId, unit_id }));
    const { error } = await supabase.from("lesson_units").insert(rows);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true, unitIds: [...want] };
}

/**
 * Promote linked units to `in_progress` and set `last_lesson_id` when a
 * lesson is completed. Idempotent — never downgrades, never auto-masters.
 * Called from lesson actions on scheduled → completed transitions and on
 * any completed lesson save with linked units.
 */
export async function autoProgressLinkedUnits(
  lessonId: string,
  studentId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("lesson_units")
    .select("unit_id")
    .eq("lesson_id", lessonId);
  const unitIds = ((links as { unit_id: string }[] | null) ?? []).map(
    (r) => r.unit_id,
  );
  if (unitIds.length === 0) return;

  // Find active student_curricula for this student and figure out which
  // assignment each unit belongs to (unit → curriculum → assignment).
  const { data: assigns } = await supabase
    .from("student_curricula")
    .select("id, curriculum_id")
    .eq("student_id", studentId)
    .is("ended_at", null);
  const assignByCurriculum = new Map(
    ((assigns as { id: string; curriculum_id: string }[] | null) ?? []).map(
      (a) => [a.curriculum_id, a.id],
    ),
  );

  const { data: units } = await supabase
    .from("curriculum_units")
    .select("id, curriculum_id")
    .in("id", unitIds);
  const unitCurriculum = new Map(
    ((units as { id: string; curriculum_id: string }[] | null) ?? []).map(
      (u) => [u.id, u.curriculum_id],
    ),
  );

  // Upsert progress rows. Only set status = 'in_progress' when currently
  // 'not_started' (or absent); never overwrite mastered/skipped/in_progress.
  for (const unitId of unitIds) {
    const curriculumId = unitCurriculum.get(unitId);
    if (!curriculumId) continue;
    const assignmentId = assignByCurriculum.get(curriculumId);
    if (!assignmentId) continue;

    // Read current status.
    const { data: cur } = await supabase
      .from("student_unit_progress")
      .select("status")
      .eq("student_curriculum_id", assignmentId)
      .eq("unit_id", unitId)
      .maybeSingle();
    const currentStatus =
      (cur as { status: string } | null)?.status ?? "not_started";

    const patch: Record<string, unknown> = {
      student_curriculum_id: assignmentId,
      unit_id: unitId,
      last_lesson_id: lessonId,
    };
    if (currentStatus === "not_started") {
      patch.status = "in_progress";
    }

    await supabase
      .from("student_unit_progress")
      .upsert(patch, { onConflict: "student_curriculum_id,unit_id" });
  }
}

/**
 * Bulk-mark all non-mastered, non-skipped children of a section as mastered.
 * Use case: teacher takes over a student who's already past part of the
 * syllabus, wants to catch the plan up without per-unit clicks.
 *
 * Idempotent. Does NOT touch units that are already mastered or skipped.
 * If `sectionId` itself has no children, marks the section unit instead.
 */
export async function markSectionMasteredAction(
  studentCurriculumId: string,
  sectionId: string,
  studentId: string,
): Promise<Result<{ markedCount: number }>> {
  await requireUser();
  const supabase = await createClient();

  // Find children of this section.
  const { data: children } = await supabase
    .from("curriculum_units")
    .select("id")
    .eq("parent_unit_id", sectionId);
  const childIds = ((children as { id: string }[] | null) ?? []).map((c) => c.id);

  // If no children, treat the section itself as the unit to mark.
  const targets = childIds.length > 0 ? childIds : [sectionId];

  // Pull existing progress to avoid clobbering mastered/skipped.
  const { data: existing } = await supabase
    .from("student_unit_progress")
    .select("unit_id, status")
    .eq("student_curriculum_id", studentCurriculumId)
    .in("unit_id", targets);
  const statusMap = new Map(
    ((existing as { unit_id: string; status: string }[] | null) ?? []).map(
      (r) => [r.unit_id, r.status],
    ),
  );

  const masteredAt = new Date().toISOString();
  const upserts = targets
    .filter((id) => {
      const cur = statusMap.get(id);
      return cur !== "mastered" && cur !== "skipped";
    })
    .map((unit_id) => ({
      student_curriculum_id: studentCurriculumId,
      unit_id,
      status: "mastered",
      mastered_at: masteredAt,
    }));

  if (upserts.length === 0) {
    return { ok: true, markedCount: 0 };
  }

  const { error } = await supabase
    .from("student_unit_progress")
    .upsert(upserts, { onConflict: "student_curriculum_id,unit_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/students/${studentId}`);
  return { ok: true, markedCount: upserts.length };
}

export type UpdateUnitNotesInput = {
  studentCurriculumId: string;
  unitId: string;
  notes: string;
  studentId: string;
};

export async function updateUnitNotesAction(
  input: UpdateUnitNotesInput,
): Promise<Result> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("student_unit_progress")
    .upsert(
      {
        student_curriculum_id: input.studentCurriculumId,
        unit_id: input.unitId,
        notes: input.notes.trim() || null,
      },
      { onConflict: "student_curriculum_id,unit_id" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/students/${input.studentId}`);
  return { ok: true };
}
