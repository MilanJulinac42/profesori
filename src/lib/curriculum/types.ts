export type UnitStatus = "not_started" | "in_progress" | "mastered" | "skipped";

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  not_started: "Nije počeo",
  in_progress: "U toku",
  mastered: "Savladano",
  skipped: "Preskočeno",
};

export type Curriculum = {
  id: string;
  organization_id: string;
  subject: string;
  grade_label: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CurriculumUnit = {
  id: string;
  curriculum_id: string;
  parent_unit_id: string | null;
  title: string;
  description: string | null;
  order_index: number;
  est_lessons: number | null;
  created_at: string;
  updated_at: string;
};

export type StudentCurriculum = {
  id: string;
  student_id: string;
  curriculum_id: string;
  started_at: string;
  ended_at: string | null;
};

export type StudentUnitProgress = {
  id: string;
  student_curriculum_id: string;
  unit_id: string;
  status: UnitStatus;
  last_lesson_id: string | null;
  mastered_at: string | null;
  notes: string | null;
  updated_at: string;
};

export type CurriculumSummary = Curriculum & {
  sections_count: number;
  units_count: number;
  students_count: number;
};

export type CurriculumWithUnits = Curriculum & {
  units: CurriculumUnit[];
};

export type StudentPlanCurriculum = {
  assignment: StudentCurriculum;
  curriculum: Curriculum;
  units: CurriculumUnit[];
  progress: StudentUnitProgress[];
};

export type StudentPlan = {
  active: StudentPlanCurriculum[];
};
