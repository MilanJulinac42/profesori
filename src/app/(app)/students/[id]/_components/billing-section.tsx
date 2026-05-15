"use client";

import { useState, useTransition } from "react";
import {
  Receipt,
  Plus,
  Trash2,
  BellRing,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { sr } from "date-fns/locale";
import { EmptyState } from "@/components/empty-state";
import { formatRsd } from "@/lib/money";
import { PAYMENT_METHOD_LABELS, type Payment } from "@/lib/payments/types";
import { deletePayment } from "@/lib/payments/actions";
import type { Lesson } from "@/lib/lessons/types";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { MonthlyBillButton } from "./monthly-bill-button";

const PaymentDialog = dynamic(
  () => import("./payment-dialog").then((m) => m.PaymentDialog),
  { ssr: false },
);
const ReminderDialog = dynamic(
  () =>
    import("@/components/reminder-dialog").then((m) => m.ReminderDialog),
  { ssr: false },
);
import {
  REMINDER_CHANNEL_LABELS,
  type ReminderLog,
} from "@/lib/reminders/types";

export function BillingSection({
  studentId,
  studentName,
  parentName,
  parentPhone,
  parentEmail,
  teacherName,
  debt,
  paidTotal,
  billableTotal,
  unpaidLessons,
  unpaidLessonsCount,
  oldestUnpaidAt,
  payments,
  reminders,
  customTemplate,
}: {
  studentId: string;
  studentName: string;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  teacherName: string;
  debt: number;
  paidTotal: number;
  billableTotal: number;
  unpaidLessons: Lesson[];
  unpaidLessonsCount: number;
  oldestUnpaidAt: string | null;
  payments: Payment[];
  reminders: ReminderLog[];
  customTemplate?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  const hasCredit = debt < 0;
  const isClean = debt === 0 && billableTotal > 0;
  const lastReminder = reminders[0];

  const debtTone =
    debt > 0
      ? "text-rose-500 dark:text-rose-400"
      : hasCredit
        ? "text-emerald-500 dark:text-emerald-400"
        : "text-foreground";

  return (
    <>
      <div className="card-elevated card-glow rounded-2xl overflow-hidden">
        {/* Summary header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display text-xl text-foreground">Naplata</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {billableTotal > 0
                  ? `${formatRsd(paidTotal)} od ${formatRsd(billableTotal)} naplaćeno`
                  : "Još nema naplativih časova."}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <MonthlyBillButton studentId={studentId} />
              {debt > 0 && (
                <button
                  type="button"
                  onClick={() => setReminderOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-card border border-border text-foreground text-[0.8rem] font-medium hover:bg-secondary transition-colors"
                >
                  <BellRing className="size-3.5" strokeWidth={2} />
                  Opomena
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand text-brand-foreground text-[0.8rem] font-semibold hover:opacity-90 transition-opacity glow-brand"
              >
                <Plus className="size-3.5" strokeWidth={2.25} />
                Uplata
              </button>
            </div>
          </div>

          {/* Debt amount visualization */}
          <div className="mt-5 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
                {debt > 0 ? "Trenutni dug" : hasCredit ? "Pretplata" : "Stanje"}
              </span>
              <span
                className={cn(
                  "font-display text-3xl tabular-nums leading-none",
                  debtTone,
                )}
              >
                {hasCredit ? formatRsd(-debt) : formatRsd(debt)}
              </span>
            </div>
            {billableTotal > 0 && (
              <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all rounded-full",
                    debt > 0 ? "bg-amber-500 dark:bg-amber-400" : "bg-emerald-500 dark:bg-emerald-400",
                  )}
                  style={{
                    width: `${Math.min(100, (paidTotal / billableTotal) * 100)}%`,
                  }}
                />
              </div>
            )}
            {hasCredit && (
              <p className="text-[11px] text-muted-foreground">
                Učenik je preplatio. Sledeći časovi će se automatski računati iz
                pretplate.
              </p>
            )}
            {isClean && (
              <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Sve čisto
              </p>
            )}
            {debt > 0 && lastReminder && (
              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <BellRing className="size-3" strokeWidth={1.75} />
                Poslednja opomena:{" "}
                <span className="text-foreground font-medium">
                  {formatDistanceToNowStrict(new Date(lastReminder.sent_at), {
                    locale: sr,
                    addSuffix: true,
                  })}
                </span>{" "}
                · {REMINDER_CHANNEL_LABELS[lastReminder.channel]}
              </p>
            )}
          </div>
        </div>

        {/* Unpaid lessons */}
        {unpaidLessons.length > 0 && (
          <div>
            <div className="px-5 py-2.5 bg-secondary/30 border-b border-border flex items-baseline justify-between">
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                Neplaćeni časovi ({unpaidLessons.length})
              </p>
              <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 tabular-nums">
                {formatRsd(unpaidLessons.reduce((s, l) => s + l.price, 0))}
              </p>
            </div>
            <ul className="divide-y divide-border">
              {unpaidLessons.map((l) => {
                const dt = new Date(l.scheduled_at);
                return (
                  <li
                    key={l.id}
                    className="px-5 py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="text-xs flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400"
                      />
                      <span className="text-foreground/90 tabular-nums font-medium">
                        {dt.toLocaleDateString("sr-Latn-RS", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-muted-foreground/60">·</span>
                      <span className="text-muted-foreground">
                        {l.duration_minutes} min
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatRsd(l.price)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Payment history */}
        <div>
          <div className="px-5 py-2.5 bg-secondary/30 border-b border-border flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Uplate ({payments.length})
            </p>
            {payments.length > 0 && (
              <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 tabular-nums">
                {formatRsd(paidTotal)}
              </p>
            )}
          </div>
          {payments.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={Receipt}
                tile="emerald"
                size="compact"
                title="Još nema uplata"
                description="Klikni na „Uplata“ da evidentiraš prvu."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {payments.map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Reminder history */}
      {reminders.length > 0 && (
        <div className="card-elevated card-glow rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
              <BellRing className="size-3" strokeWidth={2} />
              Poslate opomene ({reminders.length})
            </p>
          </div>
          <ul className="divide-y divide-border">
            {reminders.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="px-5 py-2.5 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs">
                    <span className="font-medium tabular-nums text-foreground">
                      {new Date(r.sent_at).toLocaleDateString("sr-Latn-RS", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </span>
                    <span className="text-muted-foreground/60 mx-1.5">·</span>
                    <span className="text-muted-foreground">
                      {REMINDER_CHANNEL_LABELS[r.channel]}
                    </span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatRsd(r.amount_at_send)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <PaymentDialog
          studentId={studentId}
          studentName={studentName}
          suggestedAmount={debt > 0 ? debt : undefined}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}

      {reminderOpen && (
        <ReminderDialog
          open={reminderOpen}
          onClose={() => setReminderOpen(false)}
          studentId={studentId}
          parentPhone={parentPhone}
          parentEmail={parentEmail}
          customTemplate={customTemplate}
          context={{
            teacherName,
            studentName,
            parentName,
            debt,
            unpaidLessonsCount,
            oldestUnpaidAt,
          }}
        />
      )}
    </>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const [pending, startTransition] = useTransition();
  const dt = new Date(payment.paid_at);

  function onDelete() {
    if (!confirm("Obrisati ovu uplatu?")) return;
    startTransition(async () => {
      try {
        await deletePayment(payment.id);
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  return (
    <li className="px-5 py-2.5 flex items-center gap-3 group hover:bg-secondary/20 transition-colors">
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0"
      />
      <div className="text-xs text-muted-foreground tabular-nums w-20 shrink-0 font-medium">
        {dt.toLocaleDateString("sr-Latn-RS", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatRsd(payment.amount)}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {PAYMENT_METHOD_LABELS[payment.method]}
          {payment.note && (
            <>
              {" · "}
              {payment.note}
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="opacity-0 group-hover:opacity-100 size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all"
        aria-label="Obriši uplatu"
      >
        <Trash2 className="size-3.5" strokeWidth={1.75} />
      </button>
    </li>
  );
}
