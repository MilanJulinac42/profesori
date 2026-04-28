import type { SupabaseClient } from "@supabase/supabase-js";
import { BILLABLE_STATUSES, type Payment, type PaymentMethod } from "./types";
import type { Lesson } from "@/lib/lessons/types";

/* ---------------- Period analytics ---------------- */

export type BillingAnalytics = {
  revenueInPeriod: number; // paras: sum of billable lesson prices in period
  collectedInPeriod: number; // paras: sum of payment amounts in period
  heldLessonsInPeriod: number; // count of completed lessons
  paymentsCountInPeriod: number;
  collectionRate: number; // 0..100, collected / revenue
};

export async function getBillingAnalytics(
  supabase: SupabaseClient,
  range: { from: Date; to: Date },
): Promise<BillingAnalytics> {
  const [{ data: lessons }, { data: payments }] = await Promise.all([
    supabase
      .from("lessons")
      .select("price, status")
      .is("deleted_at", null)
      .in("status", BILLABLE_STATUSES)
      .gte("scheduled_at", range.from.toISOString())
      .lte("scheduled_at", range.to.toISOString()),
    supabase
      .from("payments")
      .select("amount")
      .is("deleted_at", null)
      .gte("paid_at", range.from.toISOString())
      .lte("paid_at", range.to.toISOString()),
  ]);

  type LessonRow = { price: number; status: string };
  const lessonList = (lessons as LessonRow[] | null) ?? [];
  const paymentList = (payments as { amount: number }[] | null) ?? [];

  const revenue = lessonList.reduce((s, l) => s + l.price, 0);
  const collected = paymentList.reduce((s, p) => s + p.amount, 0);
  const heldCount = lessonList.filter((l) => l.status === "completed").length;

  return {
    revenueInPeriod: revenue,
    collectedInPeriod: collected,
    heldLessonsInPeriod: heldCount,
    paymentsCountInPeriod: paymentList.length,
    collectionRate: revenue > 0 ? (collected / revenue) * 100 : 0,
  };
}

/* ---------------- Recent payments ---------------- */

export type RecentPayment = {
  id: string;
  amount: number;
  paid_at: string;
  method: PaymentMethod;
  note: string | null;
  student: { id: string; full_name: string } | null;
};

export async function getRecentPayments(
  supabase: SupabaseClient,
  limit = 10,
): Promise<RecentPayment[]> {
  const { data } = await supabase
    .from("payments")
    .select("id, amount, paid_at, method, note, students(id, full_name)")
    .is("deleted_at", null)
    .order("paid_at", { ascending: false })
    .limit(limit);

  return (
    (data as
      | {
          id: string;
          amount: number;
          paid_at: string;
          method: PaymentMethod;
          note: string | null;
          students: { id: string; full_name: string } | null;
        }[]
      | null) ?? []
  ).map((p) => ({
    id: p.id,
    amount: p.amount,
    paid_at: p.paid_at,
    method: p.method,
    note: p.note,
    student: p.students,
  }));
}

/**
 * Aggregate billing summary for a single student.
 * Debt = sum(price of billable lessons) - sum(payment amounts).
 * Negative debt = credit (overpayment).
 */
export type StudentBilling = {
  billableTotal: number; // paras
  paidTotal: number; // paras
  debt: number; // paras (positive = student owes)
  billableLessonsCount: number;
  unpaidLessons: Lesson[]; // billable lessons from oldest, with running unpaid amount
  oldestUnpaidAt: string | null;
  payments: Payment[];
};

export async function getStudentBilling(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentBilling> {
  const [{ data: lessons }, { data: payments }] = await Promise.all([
    supabase
      .from("lessons")
      .select("*")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .in("status", BILLABLE_STATUSES)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("payments")
      .select("*")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("paid_at", { ascending: false }),
  ]);

  const billableLessons = (lessons as Lesson[] | null) ?? [];
  const paymentsList = (payments as Payment[] | null) ?? [];

  const billableTotal = billableLessons.reduce((s, l) => s + l.price, 0);
  const paidTotal = paymentsList.reduce((s, p) => s + p.amount, 0);
  const debt = billableTotal - paidTotal;

  // Compute which lessons are still unpaid using FIFO allocation.
  let credit = paidTotal;
  const unpaid: Lesson[] = [];
  for (const lesson of billableLessons) {
    if (credit >= lesson.price) {
      credit -= lesson.price;
    } else {
      unpaid.push(lesson);
    }
  }

  return {
    billableTotal,
    paidTotal,
    debt,
    billableLessonsCount: billableLessons.length,
    unpaidLessons: unpaid,
    oldestUnpaidAt: unpaid[0]?.scheduled_at ?? null,
    payments: paymentsList,
  };
}

/**
 * Org-wide billing snapshot. Returns a list of students with their debt,
 * sorted descending by debt. Only includes students where debt > 0.
 */
export type OrgDebtor = {
  student_id: string;
  full_name: string;
  parent_phone: string | null;
  parent_email: string | null;
  debt: number;
  unpaidLessonsCount: number;
  oldestUnpaidAt: string | null;
};

export async function getOrgDebtors(
  supabase: SupabaseClient,
): Promise<{
  totalDebt: number;
  totalCredit: number;
  debtors: OrgDebtor[];
}> {
  const [{ data: students }, { data: lessons }, { data: payments }] =
    await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, parent_phone, parent_email")
        .is("deleted_at", null),
      supabase
        .from("lessons")
        .select("student_id, price, scheduled_at, status")
        .is("deleted_at", null)
        .in("status", BILLABLE_STATUSES)
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("payments")
        .select("student_id, amount")
        .is("deleted_at", null),
    ]);

  type StudentRow = {
    id: string;
    full_name: string;
    parent_phone: string | null;
    parent_email: string | null;
  };
  const studentList = (students as StudentRow[] | null) ?? [];

  type LessonRow = {
    student_id: string;
    price: number;
    scheduled_at: string;
    status: string;
  };
  const lessonList = (lessons as LessonRow[] | null) ?? [];

  type PaymentRow = { student_id: string; amount: number };
  const paymentList = (payments as PaymentRow[] | null) ?? [];

  // Aggregate per student.
  const lessonsByStudent: Record<string, LessonRow[]> = {};
  for (const l of lessonList) {
    (lessonsByStudent[l.student_id] ??= []).push(l);
  }
  const paidByStudent: Record<string, number> = {};
  for (const p of paymentList) {
    paidByStudent[p.student_id] = (paidByStudent[p.student_id] ?? 0) + p.amount;
  }

  let totalDebt = 0;
  let totalCredit = 0;
  const debtors: OrgDebtor[] = [];

  for (const s of studentList) {
    const lessons = lessonsByStudent[s.id] ?? [];
    const billable = lessons.reduce((sum, l) => sum + l.price, 0);
    const paid = paidByStudent[s.id] ?? 0;
    const debt = billable - paid;

    if (debt > 0) totalDebt += debt;
    if (debt < 0) totalCredit += -debt;

    if (debt > 0) {
      // FIFO unpaid count.
      let credit = paid;
      let unpaidCount = 0;
      let oldestUnpaidAt: string | null = null;
      for (const l of lessons) {
        if (credit >= l.price) {
          credit -= l.price;
        } else {
          if (unpaidCount === 0) oldestUnpaidAt = l.scheduled_at;
          unpaidCount++;
        }
      }
      debtors.push({
        student_id: s.id,
        full_name: s.full_name,
        parent_phone: s.parent_phone,
        parent_email: s.parent_email,
        debt,
        unpaidLessonsCount: unpaidCount,
        oldestUnpaidAt,
      });
    }
  }

  debtors.sort((a, b) => b.debt - a.debt);

  return { totalDebt, totalCredit, debtors };
}
