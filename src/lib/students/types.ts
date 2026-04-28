export type StudentStatus = "active" | "paused" | "inactive";

export type Student = {
  id: string;
  organization_id: string;
  full_name: string;
  grade: string | null;
  school: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  default_price_per_lesson: number; // paras
  notes: string | null;
  tags: string[];
  status: StudentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Aktivan",
  paused: "Pauziran",
  inactive: "Neaktivan",
};
