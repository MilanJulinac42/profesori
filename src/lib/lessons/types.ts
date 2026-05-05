export type LessonStatus =
  | "scheduled"
  | "completed"
  | "cancelled_by_teacher"
  | "cancelled_by_student"
  | "no_show";

export type Lesson = {
  id: string;
  organization_id: string;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: LessonStatus;
  price: number; // paras
  notes_after_lesson: string | null;
  topics_covered: string[];
  lesson_rating: number | null; // 1..5 ili null
  next_lesson_plan: string | null;
  progress_summary: string | null;
  voice_transcript_raw: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const LESSON_RATING_LABELS: Record<number, string> = {
  1: "Vrlo loše",
  2: "Slabo",
  3: "Solidno",
  4: "Dobro",
  5: "Odlično",
};

export type LessonWithStudent = Lesson & {
  students: { id: string; full_name: string } | null;
};

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  scheduled: "Zakazan",
  completed: "Održan",
  cancelled_by_teacher: "Otkazao profesor",
  cancelled_by_student: "Otkazao učenik",
  no_show: "Nije se pojavio",
};

export const LESSON_STATUS_OPTIONS: { value: LessonStatus; label: string }[] = [
  { value: "completed", label: LESSON_STATUS_LABELS.completed },
  { value: "cancelled_by_student", label: LESSON_STATUS_LABELS.cancelled_by_student },
  { value: "cancelled_by_teacher", label: LESSON_STATUS_LABELS.cancelled_by_teacher },
  { value: "no_show", label: LESSON_STATUS_LABELS.no_show },
];
