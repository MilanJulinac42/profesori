export type StudentStatus = "active" | "paused" | "inactive";

export type ReportAudience = "parent" | "student";

export type Student = {
  id: string;
  organization_id: string;
  full_name: string;
  grade: string | null;
  school: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  student_email: string | null;
  report_audience: ReportAudience;
  weekly_reports_enabled: boolean;
  monthly_reports_enabled: boolean;
  default_price_per_lesson: number; // paras
  default_lesson_duration_minutes: number;
  notes: string | null;
  tags: string[];
  status: StudentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const REPORT_AUDIENCE_LABELS: Record<ReportAudience, string> = {
  parent: "Roditelj (3. lice)",
  student: "Učenik sam (2. lice)",
};

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Aktivan",
  paused: "Pauziran",
  inactive: "Neaktivan",
};

export type EducationLevel = "osnovna" | "srednja" | "fakultet";

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  osnovna: "Osnovna škola",
  srednja: "Srednja škola",
  fakultet: "Fakultet",
};

export const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "osnovna", label: "Osnovna škola" },
  { value: "srednja", label: "Srednja škola" },
  { value: "fakultet", label: "Fakultet" },
];
