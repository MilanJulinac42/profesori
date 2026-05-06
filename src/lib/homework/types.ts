export type HomeworkStatus = "assigned" | "submitted" | "graded" | "skipped";

export const HOMEWORK_STATUS_LABELS: Record<HomeworkStatus, string> = {
  assigned: "Zadato",
  submitted: "Predato",
  graded: "Ocenjeno",
  skipped: "Preskočeno",
};

export type Homework = {
  id: string;
  organization_id: string;
  student_id: string;
  lesson_id: string | null;
  exercise_set_id: string | null;

  title: string;
  description: string | null;
  due_date: string | null; // YYYY-MM-DD

  status: HomeworkStatus;

  submission_note: string | null;
  submitted_at: string | null;

  teacher_grade: number | null;
  teacher_feedback: string | null;
  graded_at: string | null;

  public_token: string;
  submission_images: string[];

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Sadržaj koji vidi učenik/roditelj na public stranici. Isključuje sve PII teacher-side stvari. */
export type PublicHomeworkView = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: HomeworkStatus;
  submission_note: string | null;
  submitted_at: string | null;
  teacher_grade: number | null;
  teacher_feedback: string | null;
  graded_at: string | null;

  studentName: string;
  teacherName: string;

  // Pitanja iz exercise seta — bez rešenja i bez postupaka.
  exerciseQuestions: { question: string }[] | null;
};
