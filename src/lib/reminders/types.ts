export type ReminderChannel = "copy" | "sms" | "email" | "viber";

export type ReminderLog = {
  id: string;
  organization_id: string;
  student_id: string;
  channel: ReminderChannel;
  amount_at_send: number; // paras
  message: string;
  sent_at: string;
  created_at: string;
};

export const REMINDER_CHANNEL_LABELS: Record<ReminderChannel, string> = {
  copy: "Kopirano",
  sms: "SMS",
  email: "Email",
  viber: "Viber",
};
