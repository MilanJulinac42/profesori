import type { LessonStatus } from "@/lib/lessons/types";

export type PaymentMethod = "cash" | "transfer" | "revolut" | "other";

export type Payment = {
  id: string;
  organization_id: string;
  student_id: string;
  amount: number; // paras
  paid_at: string;
  method: PaymentMethod;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Keš",
  transfer: "Uplata na račun",
  revolut: "Revolut",
  other: "Drugo",
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] =
  [
    { value: "cash", label: PAYMENT_METHOD_LABELS.cash },
    { value: "transfer", label: PAYMENT_METHOD_LABELS.transfer },
    { value: "revolut", label: PAYMENT_METHOD_LABELS.revolut },
    { value: "other", label: PAYMENT_METHOD_LABELS.other },
  ];

/**
 * Lesson statuses that result in a debt (i.e., the lesson is "billable").
 * cancelled_by_teacher never charges. The other two are toggleable via settings.
 */
export const BILLABLE_STATUSES: LessonStatus[] = [
  "completed",
  "cancelled_by_student",
  "no_show",
];

/** Compute billable statuses from org settings. */
export function computeBillableStatuses(settings: {
  charge_for_cancelled_by_student?: boolean;
  charge_for_no_show?: boolean;
}): LessonStatus[] {
  const list: LessonStatus[] = ["completed"];
  if (settings.charge_for_cancelled_by_student !== false)
    list.push("cancelled_by_student");
  if (settings.charge_for_no_show !== false) list.push("no_show");
  return list;
}
