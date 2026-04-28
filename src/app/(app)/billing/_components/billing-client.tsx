"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { sr } from "date-fns/locale";
import {
  Banknote,
  AlertCircle,
  Phone,
  ArrowRight,
  TrendingUp,
  Plus,
  CheckCircle2,
  Receipt,
  BellRing,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatRsd } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  PERIOD_OPTIONS,
  PERIOD_LABELS,
  type AnalyticsPeriod,
} from "@/lib/analytics/queries";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments/types";
import type {
  BillingAnalytics,
  OrgDebtor,
  RecentPayment,
} from "@/lib/payments/queries";
import {
  RecordPaymentDialog,
  type StudentForPicker,
} from "./record-payment-dialog";
import { ReminderDialog } from "@/components/reminder-dialog";

type DebtorWithReminder = OrgDebtor & { lastReminderAt: string | null };

type PickerStudentExtended = StudentForPicker & {
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
};

export function BillingClient({
  period,
  periodLabel,
  analytics,
  totalDebt,
  totalCredit,
  debtors,
  recentPayments,
  pickerStudents,
  teacherName,
}: {
  period: AnalyticsPeriod;
  periodLabel: string;
  analytics: BillingAnalytics;
  totalDebt: number;
  totalCredit: number;
  debtors: DebtorWithReminder[];
  recentPayments: RecentPayment[];
  pickerStudents: PickerStudentExtended[];
  teacherName: string;
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    studentId?: string;
  }>({ open: false });

  const [reminderState, setReminderState] = useState<{
    open: boolean;
    debtor: DebtorWithReminder | null;
  }>({ open: false, debtor: null });

  const openDialog = (studentId?: string) =>
    setDialogState({ open: true, studentId });
  const closeDialog = () => setDialogState({ open: false });

  const openReminder = (debtor: DebtorWithReminder) =>
    setReminderState({ open: true, debtor });
  const closeReminder = () =>
    setReminderState({ open: false, debtor: null });

  const reminderStudent = reminderState.debtor
    ? pickerStudents.find((s) => s.id === reminderState.debtor!.student_id)
    : null;

  const now = Date.now();
  const overThirtyDays = debtors.filter((d) => {
    if (!d.oldestUnpaidAt) return false;
    return (now - new Date(d.oldestUnpaidAt).getTime()) / 86400000 > 30;
  });

  return (
    <>
      <div className="px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
        <PageHeader
          title="Naplata"
          description="Pregled prihoda, dugovanja i evidentiranje uplata."
          actions={
            <Button
              size="sm"
              onClick={() => openDialog()}
              disabled={pickerStudents.length === 0}
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Nova uplata
            </Button>
          }
        />

        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="font-medium">Ovo je samo evidencija.</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Novac primaš direktno od učenika ili roditelja. Platforma ne
            procesuje uplate.
          </p>
        </div>

        {/* Period analytics */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">Performanse</h2>
              <p className="text-xs text-muted-foreground">{periodLabel}</p>
            </div>
            <PeriodSelector active={period} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Zarađeno"
              value={formatRsd(analytics.revenueInPeriod, false)}
              unit="RSD"
              icon={Banknote}
              hint={
                analytics.heldLessonsInPeriod > 0
                  ? `${analytics.heldLessonsInPeriod} ${
                      analytics.heldLessonsInPeriod === 1
                        ? "održan čas"
                        : analytics.heldLessonsInPeriod < 5
                          ? "održana časa"
                          : "održanih časova"
                    }`
                  : "Nema održanih časova"
              }
            />
            <Stat
              label="Naplaćeno"
              value={formatRsd(analytics.collectedInPeriod, false)}
              unit="RSD"
              icon={CheckCircle2}
              hint={
                analytics.paymentsCountInPeriod > 0
                  ? `${analytics.paymentsCountInPeriod} ${
                      analytics.paymentsCountInPeriod === 1
                        ? "uplata"
                        : "uplata"
                    }`
                  : "Nema uplata"
              }
            />
            <Stat
              label="Naplativost"
              value={
                analytics.revenueInPeriod > 0
                  ? `${Math.round(analytics.collectionRate)}%`
                  : "—"
              }
              icon={TrendingUp}
              hint={
                analytics.revenueInPeriod > 0
                  ? "Naplaćeno / zarađeno"
                  : "Nema podataka"
              }
            />
            <Stat
              label="Trenutni dug"
              value={formatRsd(totalDebt, false)}
              unit="RSD"
              icon={AlertCircle}
              hint={
                debtors.length > 0
                  ? `${debtors.length} ${
                      debtors.length === 1 ? "učenik duguje" : "učenika dugu"
                    }`
                  : "Niko ne duguje"
              }
              tone={overThirtyDays.length > 0 ? "warning" : "default"}
            />
          </div>

          {totalCredit > 0 && (
            <p className="text-xs text-muted-foreground">
              Pretplate (kredit):{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatRsd(totalCredit)}
              </span>
            </p>
          )}
        </section>

        {/* Two-column body */}
        <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <DebtorsList
            debtors={debtors}
            onRecordPayment={openDialog}
            onSendReminder={openReminder}
          />
          <RecentPaymentsList payments={recentPayments} />
        </section>
      </div>

      <RecordPaymentDialog
        key={dialogState.studentId ?? "any"}
        students={pickerStudents}
        open={dialogState.open}
        defaultStudentId={dialogState.studentId}
        onClose={closeDialog}
      />

      {reminderState.debtor && reminderStudent && (
        <ReminderDialog
          open={reminderState.open}
          onClose={closeReminder}
          studentId={reminderState.debtor.student_id}
          parentPhone={reminderStudent.parent_phone}
          parentEmail={reminderStudent.parent_email}
          context={{
            teacherName,
            studentName: reminderState.debtor.full_name,
            parentName: reminderStudent.parent_name,
            debt: reminderState.debtor.debt,
            unpaidLessonsCount: reminderState.debtor.unpaidLessonsCount,
            oldestUnpaidAt: reminderState.debtor.oldestUnpaidAt,
          }}
        />
      )}
    </>
  );
}

/* -------- period selector -------- */
function PeriodSelector({ active }: { active: AnalyticsPeriod }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 text-xs">
      {PERIOD_OPTIONS.map((p) => {
        const isActive = active === p;
        const href = p === "month" ? "/billing" : `/billing?period=${p}`;
        return (
          <Link
            key={p}
            href={href}
            scroll={false}
            className={cn(
              "rounded-[4px] px-2.5 py-1 transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            {PERIOD_LABELS[p].replace("Poslednjih ", "")}
          </Link>
        );
      })}
    </div>
  );
}

/* -------- stat card -------- */
function Stat({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 min-h-[110px]">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs">{label}</span>
        <Icon
          className={cn(
            "size-3.5",
            tone === "warning" && "text-destructive",
          )}
          strokeWidth={1.75}
        />
      </div>
      <div className="flex items-baseline gap-1.5 mt-auto">
        <span
          className={cn(
            "text-2xl font-medium tracking-tight tabular-nums",
            tone === "warning" && "text-destructive",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && (
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {hint}
        </p>
      )}
    </div>
  );
}

/* -------- debtors list -------- */
function DebtorsList({
  debtors,
  onRecordPayment,
  onSendReminder,
}: {
  debtors: DebtorWithReminder[];
  onRecordPayment: (studentId?: string) => void;
  onSendReminder: (debtor: DebtorWithReminder) => void;
}) {
  const now = Date.now();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-medium">Učenici sa dugom</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {debtors.length === 0
              ? "Niko ne duguje"
              : "Sortirano po visini duga."}
          </p>
        </div>
      </div>

      {debtors.length === 0 ? (
        <div className="px-5 py-12">
          <EmptyState
            icon={Banknote}
            title="Sve čisto"
            description="Kad obeležiš čas kao održan a još nema uplate, učenik se pojavljuje ovde."
            className="border-0"
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {debtors.map((d) => {
            const ageDays = d.oldestUnpaidAt
              ? Math.floor(
                  (now - new Date(d.oldestUnpaidAt).getTime()) / 86400000,
                )
              : 0;
            const isOld = ageDays > 30;
            return (
              <li
                key={d.student_id}
                className="px-5 py-3 flex items-center gap-4 hover:bg-secondary/30 transition-colors"
              >
                <Link
                  href={`/students/${d.student_id}`}
                  className="flex items-center gap-3 flex-1 min-w-0 group"
                >
                  <Avatar name={d.full_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate group-hover:underline underline-offset-4">
                        {d.full_name}
                      </p>
                      {isOld && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-destructive">
                          <AlertCircle className="size-3" strokeWidth={2} />
                          {ageDays} dana
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {d.unpaidLessonsCount}{" "}
                      {d.unpaidLessonsCount === 1
                        ? "neplaćen čas"
                        : d.unpaidLessonsCount < 5
                          ? "neplaćena časa"
                          : "neplaćenih časova"}
                      {d.parent_phone && (
                        <>
                          {" · "}
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" strokeWidth={1.75} />
                            {d.parent_phone}
                          </span>
                        </>
                      )}
                    </p>
                    {d.lastReminderAt && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Opomena{" "}
                        {formatDistanceToNowStrict(new Date(d.lastReminderAt), {
                          locale: sr,
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <p
                    className={cn(
                      "text-base font-medium tabular-nums",
                      isOld && "text-destructive",
                    )}
                  >
                    {formatRsd(d.debt)}
                  </p>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => onSendReminder(d)}
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <BellRing className="size-3" strokeWidth={1.75} />
                      Opomena
                    </button>
                    <button
                      type="button"
                      onClick={() => onRecordPayment(d.student_id)}
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      Uplata
                      <ArrowRight className="size-3" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* -------- recent payments list -------- */
function RecentPaymentsList({
  payments,
}: {
  payments: RecentPayment[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-medium">Skoro evidentirano</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Poslednje uplate
          </p>
        </div>
        <Receipt
          className="size-4 text-muted-foreground"
          strokeWidth={1.75}
        />
      </div>
      {payments.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-xs text-muted-foreground">
            Još nema evidentiranih uplata.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {payments.map((p) => {
            const dt = new Date(p.paid_at);
            return (
              <li key={p.id} className="px-5 py-3">
                <Link
                  href={
                    p.student
                      ? `/students/${p.student.id}`
                      : "/billing"
                  }
                  className="flex items-center gap-3 group"
                >
                  <div className="text-xs text-muted-foreground tabular-nums w-14 shrink-0">
                    {dt.toLocaleDateString("sr-Latn-RS", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:underline underline-offset-4">
                      {p.student?.full_name ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {PAYMENT_METHOD_LABELS[p.method]}
                      {p.note && (
                        <>
                          {" · "}
                          {p.note}
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatRsd(p.amount)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* -------- avatar -------- */
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
      {initials || "?"}
    </span>
  );
}

