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
  Wallet,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
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
import dynamic from "next/dynamic";
import type { StudentForPicker } from "./record-payment-dialog";

const RecordPaymentDialog = dynamic(
  () =>
    import("./record-payment-dialog").then((m) => m.RecordPaymentDialog),
  { ssr: false },
);
const ReminderDialog = dynamic(
  () =>
    import("@/components/reminder-dialog").then((m) => m.ReminderDialog),
  { ssr: false },
);

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
  customTemplate,
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
  customTemplate: string | null;
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
      <div className="px-4 sm:px-8 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
        <PageHeader
          title="Naplata"
          description="Pregled prihoda, dugovanja i evidentiranje uplata."
          actions={
            <button
              type="button"
              onClick={() => openDialog()}
              disabled={pickerStudents.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              Nova uplata
            </button>
          }
        />

        <div className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm flex items-start gap-3">
          <Info
            className="size-4 text-muted-foreground/70 shrink-0 mt-0.5"
            strokeWidth={1.75}
          />
          <div className="min-w-0">
            <p className="font-semibold">Platforma služi za evidenciju.</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Novac primaš direktno od učenika ili roditelja — platforma ne
              procesuje uplate.
            </p>
          </div>
        </div>

        {/* Period analytics */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
                Performanse
              </span>
              <span className="text-[11px] text-muted-foreground/70">
                · {periodLabel.toLowerCase()}
              </span>
            </div>
            <PeriodSelector active={period} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Zarađeno"
              value={formatRsd(analytics.revenueInPeriod, false)}
              unit="RSD"
              icon={Banknote}
              tile="cyan"
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
            <StatCard
              label="Naplaćeno"
              value={formatRsd(analytics.collectedInPeriod, false)}
              unit="RSD"
              icon={CheckCircle2}
              tile="emerald"
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
            <StatCard
              label="Naplativost"
              value={
                analytics.revenueInPeriod > 0
                  ? `${Math.round(analytics.collectionRate)}%`
                  : "—"
              }
              icon={TrendingUp}
              tile="violet"
              hint={
                analytics.revenueInPeriod > 0
                  ? "Naplaćeno / zarađeno"
                  : "Nema podataka"
              }
            />
            <StatCard
              label="Trenutni dug"
              value={formatRsd(totalDebt, false)}
              unit="RSD"
              icon={Wallet}
              tile={
                totalDebt === 0
                  ? "emerald"
                  : overThirtyDays.length > 0
                    ? "rose"
                    : "amber"
              }
              hint={
                debtors.length > 0
                  ? `${debtors.length} ${
                      debtors.length === 1 ? "učenik duguje" : "učenika duguje"
                    }${overThirtyDays.length > 0 ? ` · ${overThirtyDays.length} preko 30 dana` : ""}`
                  : "Niko ne duguje"
              }
            />
          </div>

          {totalCredit > 0 && (
            <p className="text-xs text-muted-foreground">
              Pretplate (kredit):{" "}
              <span className="font-semibold text-foreground tabular-nums">
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

      {dialogState.open && (
        <RecordPaymentDialog
          key={dialogState.studentId ?? "any"}
          students={pickerStudents}
          open={dialogState.open}
          defaultStudentId={dialogState.studentId}
          onClose={closeDialog}
        />
      )}

      {reminderState.debtor && reminderStudent && (
        <ReminderDialog
          open={reminderState.open}
          onClose={closeReminder}
          studentId={reminderState.debtor.student_id}
          parentPhone={reminderStudent.parent_phone}
          parentEmail={reminderStudent.parent_email}
          customTemplate={customTemplate}
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
    <div className="inline-flex items-center gap-0.5 rounded-full bg-card border border-border p-0.5 text-[11px]">
      {PERIOD_OPTIONS.map((p) => {
        const isActive = active === p;
        const href = p === "month" ? "/billing" : `/billing?period=${p}`;
        return (
          <Link
            key={p}
            href={href}
            scroll={false}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              isActive
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PERIOD_LABELS[p].replace("Poslednjih ", "")}
          </Link>
        );
      })}
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
    <div className="card-elevated card-glow rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-xl text-foreground">
            Učenici sa dugom
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {debtors.length === 0
              ? "Niko ne duguje"
              : "Sortirano po visini duga"}
          </p>
        </div>
        {debtors.length > 0 && (
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground tabular-nums">
            {debtors.length}
          </span>
        )}
      </div>

      {debtors.length === 0 ? (
        <div className="px-5 py-8">
          <EmptyState
            icon={CheckCircle2}
            tile="emerald"
            title="Sve čisto"
            description="Kad obeležiš čas kao održan a još nema uplate, učenik se pojavljuje ovde."
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
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-secondary/30 transition-colors"
              >
                <Link
                  href={`/students/${d.student_id}`}
                  className="flex items-center gap-3 flex-1 min-w-0 group"
                >
                  <Avatar name={d.full_name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[0.95rem] font-semibold truncate text-foreground group-hover:underline underline-offset-4">
                        {d.full_name}
                      </p>
                      {isOld && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-500 dark:text-rose-400">
                          <AlertCircle className="size-3" strokeWidth={2.25} />
                          {ageDays} dana
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
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
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5 inline-flex items-center gap-1">
                        <BellRing className="size-3" strokeWidth={1.75} />
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
                      "text-base font-semibold tabular-nums",
                      isOld
                        ? "text-rose-500 dark:text-rose-400"
                        : "text-foreground",
                    )}
                  >
                    {formatRsd(d.debt)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSendReminder(d)}
                      title="Pošalji opomenu"
                      className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <BellRing className="size-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRecordPayment(d.student_id)}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-brand text-brand-foreground hover:opacity-90 transition-opacity"
                    >
                      Uplata
                      <ArrowRight className="size-3" strokeWidth={2.25} />
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
    <div className="card-elevated card-glow rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-foreground">
            Skoro evidentirano
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Poslednje uplate
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl tile-emerald">
          <Receipt className="size-4" strokeWidth={2} />
        </div>
      </div>
      {payments.length === 0 ? (
        <div className="px-5 py-8">
          <EmptyState
            icon={Receipt}
            tile="emerald"
            size="compact"
            title="Još nema uplata"
            description="Kad evidentiraš prvu uplatu, pojaviće se ovde."
          />
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

