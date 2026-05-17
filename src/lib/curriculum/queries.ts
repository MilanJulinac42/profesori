import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Curriculum,
  CurriculumSummary,
  CurriculumUnit,
  CurriculumWithUnits,
  StudentCurriculum,
  StudentPlan,
  StudentPlanCurriculum,
  StudentUnitProgress,
} from "./types";

export async function listOrgCurricula(
  supabase: SupabaseClient,
): Promise<CurriculumSummary[]> {
  const { data: rows } = await supabase
    .from("curricula")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  const curricula = (rows as Curriculum[] | null) ?? [];
  if (curricula.length === 0) return [];

  const ids = curricula.map((c) => c.id);

  const { data: unitRows } = await supabase
    .from("curriculum_units")
    .select("curriculum_id, parent_unit_id")
    .in("curriculum_id", ids);
  const units =
    (unitRows as { curriculum_id: string; parent_unit_id: string | null }[] | null) ?? [];

  const { data: assignRows } = await supabase
    .from("student_curricula")
    .select("curriculum_id")
    .in("curriculum_id", ids)
    .is("ended_at", null);
  const assigns = (assignRows as { curriculum_id: string }[] | null) ?? [];

  return curricula.map((c) => {
    const cUnits = units.filter((u) => u.curriculum_id === c.id);
    return {
      ...c,
      sections_count: cUnits.filter((u) => u.parent_unit_id === null).length,
      units_count: cUnits.length,
      students_count: assigns.filter((a) => a.curriculum_id === c.id).length,
    };
  });
}

export async function getCurriculumWithUnits(
  supabase: SupabaseClient,
  id: string,
): Promise<CurriculumWithUnits | null> {
  const { data: c } = await supabase
    .from("curricula")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!c) return null;

  const { data: units } = await supabase
    .from("curriculum_units")
    .select("*")
    .eq("curriculum_id", id)
    .order("order_index", { ascending: true });

  return {
    ...(c as Curriculum),
    units: (units as CurriculumUnit[] | null) ?? [],
  };
}

export async function getStudentPlan(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentPlan> {
  const { data: assignRows } = await supabase
    .from("student_curricula")
    .select("*")
    .eq("student_id", studentId)
    .is("ended_at", null)
    .order("started_at", { ascending: true });

  const assignments = (assignRows as StudentCurriculum[] | null) ?? [];
  if (assignments.length === 0) return { active: [] };

  const curriculumIds = assignments.map((a) => a.curriculum_id);
  const assignmentIds = assignments.map((a) => a.id);

  const [curriculaRes, unitsRes, progressRes] = await Promise.all([
    supabase.from("curricula").select("*").in("id", curriculumIds).is("deleted_at", null),
    supabase
      .from("curriculum_units")
      .select("*")
      .in("curriculum_id", curriculumIds)
      .order("order_index", { ascending: true }),
    supabase
      .from("student_unit_progress")
      .select("*")
      .in("student_curriculum_id", assignmentIds),
  ]);

  const curricula = (curriculaRes.data as Curriculum[] | null) ?? [];
  const units = (unitsRes.data as CurriculumUnit[] | null) ?? [];
  const progress = (progressRes.data as StudentUnitProgress[] | null) ?? [];

  const active: StudentPlanCurriculum[] = assignments
    .map((a) => {
      const curriculum = curricula.find((c) => c.id === a.curriculum_id);
      if (!curriculum) return null;
      return {
        assignment: a,
        curriculum,
        units: units.filter((u) => u.curriculum_id === curriculum.id),
        progress: progress.filter((p) => p.student_curriculum_id === a.id),
      };
    })
    .filter((x): x is StudentPlanCurriculum => x !== null);

  return { active };
}

/**
 * Flat lista jedinica iz svih aktivnih kurikuluma jednog učenika, sa
 * uračunatim trenutnim statusom. Koristi se u lesson dialog-u za picker
 * "Koje teme si pokrio?".
 */
export type StudentPickableUnit = {
  unit_id: string;
  unit_title: string;
  section_title: string | null;
  curriculum_id: string;
  curriculum_name: string;
  student_curriculum_id: string;
  status: import("./types").UnitStatus;
  est_lessons: number | null;
};

export async function listStudentPickableUnits(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentPickableUnit[]> {
  const plan = await getStudentPlan(supabase, studentId);
  const result: StudentPickableUnit[] = [];
  for (const a of plan.active) {
    const sectionsById = new Map<string, string>();
    for (const u of a.units) {
      if (u.parent_unit_id === null) sectionsById.set(u.id, u.title);
    }
    const progressByUnit = new Map(a.progress.map((p) => [p.unit_id, p.status]));
    // Sort so picker is hierarchically grouped by section.
    const sorted = [...a.units].sort((x, y) => {
      const xs = x.parent_unit_id ?? x.id;
      const ys = y.parent_unit_id ?? y.id;
      if (xs !== ys) return xs.localeCompare(ys);
      return x.order_index - y.order_index;
    });
    for (const u of sorted) {
      // Skip section-rows that have children — only subtopics are pickable.
      // For sections without children, include them as standalone units.
      const isSection = u.parent_unit_id === null;
      const hasChildren =
        isSection && a.units.some((c) => c.parent_unit_id === u.id);
      if (isSection && hasChildren) continue;
      result.push({
        unit_id: u.id,
        unit_title: u.title,
        section_title: u.parent_unit_id
          ? (sectionsById.get(u.parent_unit_id) ?? null)
          : null,
        curriculum_id: a.curriculum.id,
        curriculum_name: a.curriculum.name,
        student_curriculum_id: a.assignment.id,
        status: progressByUnit.get(u.id) ?? "not_started",
        est_lessons: u.est_lessons,
      });
    }
  }
  return result;
}

/**
 * Lessons that have been tagged with this unit, for the given student.
 * Returns most-recent-first, with date + duration + rating + topic tags.
 */
export type UnitLesson = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  rating: number | null;
  topics: string[];
};

export async function getLessonsForUnit(
  supabase: SupabaseClient,
  unitId: string,
  studentId: string,
  limit = 20,
): Promise<UnitLesson[]> {
  // lesson_units rows for this unit → lesson_ids → lessons for this student.
  const { data: links } = await supabase
    .from("lesson_units")
    .select("lesson_id")
    .eq("unit_id", unitId);
  const ids = ((links as { lesson_id: string }[] | null) ?? []).map(
    (r) => r.lesson_id,
  );
  if (ids.length === 0) return [];

  const { data: lessons } = await supabase
    .from("lessons")
    .select(
      "id, scheduled_at, duration_minutes, status, lesson_rating, topics_covered",
    )
    .in("id", ids)
    .eq("student_id", studentId)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(limit);

  return (
    (lessons as
      | {
          id: string;
          scheduled_at: string;
          duration_minutes: number;
          status: string;
          lesson_rating: number | null;
          topics_covered: string[] | null;
        }[]
      | null) ?? []
  ).map((l) => ({
    id: l.id,
    scheduled_at: l.scheduled_at,
    duration_minutes: l.duration_minutes,
    status: l.status,
    rating: l.lesson_rating,
    topics: l.topics_covered ?? [],
  }));
}

export async function getLessonUnitIds(
  supabase: SupabaseClient,
  lessonId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("lesson_units")
    .select("unit_id")
    .eq("lesson_id", lessonId);
  return ((data as { unit_id: string }[] | null) ?? []).map((r) => r.unit_id);
}

/**
 * Subject autocomplete: predmeti koje je org već koristila (iz curricula i,
 * po želji, public profila).
 */
export async function listOrgSubjects(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data } = await supabase
    .from("curricula")
    .select("subject")
    .is("deleted_at", null);
  const set = new Set<string>();
  for (const row of (data as { subject: string }[] | null) ?? []) {
    if (row.subject) set.add(row.subject);
  }
  return Array.from(set).sort();
}
