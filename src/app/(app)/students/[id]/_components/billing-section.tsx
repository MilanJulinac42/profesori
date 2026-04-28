"use client";

import { useState, useTransition } from "react";
import { Banknote, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRsd } from "@/lib/money";
import { PAYMENT_METHOD_LABELS, type Payment } from "@/lib/payments/types";
import { deletePayment } from "@/lib/payments/actions";
import type { Lesson } from "@/lib/lessons/types";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "./payment-dialog";

export function BillingSection({
  studentId,
  studentName,
  debt,
  paidTotal,
  billableTotal,
  unpaidLessons,
  payments,
}: {
  studentId: string;
  studentName: string;
  debt: number;
  paidTotal: number;
  billableTotal: number;
  unpaidLessons: Lesson[];
  payments: Payment[];
}) {
  const [open, setOpen] = useState(false);

  const hasCredit = debt < 0;
  const isClean = debt === 0 && billableTotal > 0;

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Summary header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">Naplata</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {billableTotal > 0
                  ? `${formatRsd(paidTotal)} od ${formatRsd(billableTotal)} naplaćeno`
                  : "Još nema naplativih časova."}
              </p>
            </div>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-3.5" strokeWidth={2} />
              Uplata
            </Button>
          </div>

          {/* Debt amount visualization */}
          <div className="mt-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {debt > 0 ? "Trenutni dug" : hasCredit ? "Pretplata" : "Stanje"}
              </span>
              <span
                className={cn(
                  "text-2xl font-medium tabular-nums tracking-tight",
                  debt > 0 && "text-foreground",
                  hasCredit && "text-foreground",
                  isClean && "text-muted-foreground",
                )}
              >
                {hasCredit ? formatRsd(-debt) : formatRsd(debt)}
              </span>
            </div>
            {billableTotal > 0 && (
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-foreground transition-all"
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
              <p className="text-[11px] text-muted-foreground">
                Sve čisto.
              </p>
            )}
          </div>
        </div>

        {/* Unpaid lessons */}
        {unpaidLessons.length > 0 && (
          <div>
            <div className="px-5 py-2 bg-secondary/30 border-b border-border flex items-baseline justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Neplaćeni časovi ({unpaidLessons.length})
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
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
                    <div className="text-xs">
                      <span className="text-muted-foreground tabular-nums">
                        {dt.toLocaleDateString("sr-Latn-RS", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-muted-foreground/60 mx-1.5">·</span>
                      <span className="text-muted-foreground">
                        {l.duration_minutes} min
                      </span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
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
          <div className="px-5 py-2 bg-secondary/30 border-b border-border flex items-baseline justify-between">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Uplate ({payments.length})
            </p>
            {payments.length > 0 && (
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatRsd(paidTotal)}
              </p>
            )}
          </div>
          {payments.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <Banknote
                className="size-4 text-muted-foreground mx-auto"
                strokeWidth={1.75}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Još nema evidentiranih uplata.
              </p>
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

      <PaymentDialog
        studentId={studentId}
        studentName={studentName}
        suggestedAmount={debt > 0 ? debt : undefined}
        open={open}
        onClose={() => setOpen(false)}
      />
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
    <li className="px-5 py-2.5 flex items-center gap-3 group">
      <div className="text-xs text-muted-foreground tabular-nums w-20 shrink-0">
        {dt.toLocaleDateString("sr-Latn-RS", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium tabular-nums">
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
