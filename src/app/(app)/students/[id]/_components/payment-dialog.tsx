"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Banknote, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "@/lib/payments/types";
import { recordPayment } from "@/lib/payments/actions";
import { cn } from "@/lib/utils";
import { formatRsd } from "@/lib/money";

export function PaymentDialog({
  studentId,
  studentName,
  suggestedAmount,
  open,
  onClose,
}: {
  studentId: string;
  studentName: string;
  suggestedAmount?: number; // paras
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <RecordPaymentForm
          studentId={studentId}
          studentName={studentName}
          suggestedAmount={suggestedAmount}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentForm({
  studentId,
  studentName,
  suggestedAmount,
  onDone,
}: {
  studentId: string;
  studentName: string;
  suggestedAmount?: number;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(
    suggestedAmount && suggestedAmount > 0
      ? String(Math.round(suggestedAmount / 100))
      : "",
  );
  const [paidAt, setPaidAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit() {
    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("paid_at", paidAt);
    fd.set("method", method);
    if (note) fd.set("note", note);

    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      const res = await recordPayment(studentId, undefined, fd);
      if (res?.error) setError(res.error);
      else if (res?.fieldErrors)
        setFieldErrors(res.fieldErrors as Record<string, string>);
      else onDone();
    });
  }

  return (
    <div>
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <DialogHeader>
          <DialogTitle>Evidentiraj uplatu</DialogTitle>
          <DialogDescription>
            {studentName}
            {suggestedAmount && suggestedAmount > 0 && (
              <>
                {" · "}
                <span>predloženo: {formatRsd(suggestedAmount)}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="px-5 py-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs">
            <Banknote
              className="size-3 inline -mt-0.5 mr-1"
              strokeWidth={1.75}
            />
            Iznos (RSD)
          </Label>
          <Input
            id="amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="3000"
            required
            aria-invalid={!!fieldErrors.amount}
          />
          {fieldErrors.amount && (
            <p className="text-xs text-destructive">{fieldErrors.amount}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="paid_at" className="text-xs">
              <CalendarDays
                className="size-3 inline -mt-0.5 mr-1"
                strokeWidth={1.75}
              />
              Datum uplate
            </Label>
            <Input
              id="paid_at"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
              aria-invalid={!!fieldErrors.paid_at}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method" className="text-xs">
              Način
            </Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod((v ?? "cash") as PaymentMethod)}
            >
              <SelectTrigger id="method" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    PAYMENT_METHOD_LABELS[value as PaymentMethod] ?? "Način"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-xs">
            Beleška
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="npr. uplata za april"
          />
        </div>

        {/* Quick amount chips */}
        {suggestedAmount && suggestedAmount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <p className="w-full text-[11px] text-muted-foreground">
              Brzi iznos:
            </p>
            {[
              { label: "Pun dug", value: Math.round(suggestedAmount / 100) },
              {
                label: "Pola",
                value: Math.round(suggestedAmount / 200),
              },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setAmount(String(o.value))}
                className={cn(
                  "rounded-md border border-border bg-card hover:bg-secondary px-2.5 py-1 text-xs transition-colors tabular-nums",
                )}
              >
                {o.label}: {o.value} RSD
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <DialogFooter className="!mx-0 !mb-0">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Otkaži
        </Button>
        <Button type="button" size="sm" disabled={pending} onClick={onSubmit}>
          {pending ? "Čuvanje..." : "Evidentiraj uplatu"}
        </Button>
      </DialogFooter>
    </div>
  );
}
