export type BookingStatus = "new" | "contacted" | "converted" | "rejected";

export type BookingRequest = {
  id: string;
  organization_id: string;
  parent_name: string;
  parent_phone: string | null;
  parent_email: string | null;
  student_grade: string | null;
  subject: string | null;
  message: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "Novi",
  contacted: "Kontaktiran",
  converted: "Konvertovan u učenika",
  rejected: "Odbijen",
};
