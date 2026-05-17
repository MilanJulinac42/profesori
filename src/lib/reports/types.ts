import type { ReportAudience } from "@/lib/students/types";

export type ReportKind = "weekly" | "monthly";

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  weekly: "Nedeljni izveštaj",
  monthly: "Mesečni izveštaj",
};

export type CurriculumProgressBlock = {
  /** Per-curriculum summary. Only includes curricula that are currently
   *  assigned to the student (active). */
  curricula: Array<{
    name: string;
    subject: string;
    gradeLabel: string | null;
    /** Overall % savladano / total leaves. */
    progressPct: number;
    totalUnits: number;
    masteredTotal: number;
    /** Unit titles newly mastered within the report period. */
    newlyMastered: string[];
    /** Unit titles still in_progress, touched within the period (last lesson
     *  linked to one of the lessons in the period). */
    inProgressNow: string[];
  }>;
};

export type LessonInReport = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string; // LessonStatus
  topics: string[];
  rating: number | null;
  progress_summary: string | null;
};

export type ReportData = {
  kind: ReportKind;
  audience: ReportAudience;

  studentName: string;
  studentGrade: string | null;
  parentName: string | null;
  teacherName: string;

  // Period (inclusive start, exclusive end).
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string; // npr. "5–11. maj 2026."

  // Aggregates.
  lessonsHeld: number;
  lessonsCancelled: number;
  totalMinutes: number;
  topTopics: string[]; // top 8 unique
  avgRating: number | null;

  // Per-lesson breakdown.
  lessons: LessonInReport[];

  // Plan napred (iz najnovijeg next_lesson_plan).
  nextLessonPlan: string | null;

  // Naplata.
  paidThisPeriod: number; // paras
  totalDebtNow: number; // paras (negative = credit)

  // Domaći u periodu.
  homeworkAssigned: number;
  homeworkSubmitted: number;

  // Napredak kroz kurikulum(e) — null ako učenik nema dodeljenih.
  curriculumProgress: CurriculumProgressBlock | null;

  // AI uvodni paragraf — kratak, prirodan, lice prilagođeno publici.
  aiIntro: string;

  /** Optional custom closing line set in Podešavanja. Supports {ime_profesora}. */
  customClosing?: string;

  // Telemetry.
  aiInputTokens: number;
  aiOutputTokens: number;
};

export type ReportLog = {
  id: string;
  organization_id: string;
  student_id: string;
  kind: ReportKind;
  audience: ReportAudience;
  period_start: string;
  period_end: string;
  recipient_email: string | null;
  resend_message_id: string | null;
  status: "sent" | "failed" | "preview" | "draft";
  error_message: string | null;
  subject: string;
  html_body: string;
  data_snapshot: Record<string, unknown>;
  ai_input_tokens: number;
  ai_output_tokens: number;
  sent_at: string;
  created_at: string;
  updated_at: string;
};
