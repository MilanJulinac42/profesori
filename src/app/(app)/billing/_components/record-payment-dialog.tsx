"use client";

import { useState, useTransition, useMemo } from "react";
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
import { formatRsd } from "@/lib/money";
import { cn } from "@/lib/utils";

export type StudentForPicker = {
  id: string;
  full_name: string;
  debt: number; // paras
};

export function RecordPaymentDialog({
  students,
  defaultStudentId,
  open,
  onClose,
}: {
  students: StudentForPicker[];
  defaultStudentId?: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <Form
          students={students}
          defaultStudentId={defaultStudentId}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function Form({
  students,
  defaultStudentId,
  onDone,
}: {
  students: StudentForPicker[];
  defaultStudentId?: string;
  onDone: () => void;
}) {
  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) => {
        if (b.debt !== a.debt) return b.debt - a.debt;
        return a.full_name.localeCompare(b.full_name);
      }),
    [students],
  );

  const [studentId, setStudentId] = useState<string>(
    defaultStudentId ?? sortedStudents[0]?.id ?? "",
  );
  const selectedStudent = sortedStudents.find((s) => s.id === studentId);
  const debt = selectedStudent?.debt ?? 0;

  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit() {
    if (!studentId) {
      setFieldErrors({ student_id: "Izaberi učenika." });
      return;
    }
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
            Izaberi učenika i unesi iznos koji je uplaćen.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Student picker */}
        <div className="space-y-1.5">
          <Label className="text-xs">Učenik</Label>
          <Select
            value={studentId}
            onValueChange={(v) => setStudentId(v ?? "")}
          >
            <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.student_id}>
              <SelectValue placeholder="Izaberi učenika">
                {(value: string | null) => {
                  const s = sortedStudents.find((x) => x.id === value);
                  return s?.full_name ?? "Izaberi učenika";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sortedStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center justify-between gap-2 w-full">
                    <span className="truncate">{s.full_name}</span>
                    {s.debt > 0 && (
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                        duguje {formatRsd(s.debt)}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.student_id && (
            <p className="text-xs text-destructive">{fieldErrors.student_id}</p>
          )}
          {selectedStudent && debt > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Trenutni dug: {formatRsd(debt)}
            </p>
          )}
        </div>

        {/* Amount */}
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
          {debt > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(debt / 100)))}
                className="rounded-md border border-border bg-card hover:bg-secondary px-2.5 py-1 text-xs transition-colors tabular-nums"
              >
                Pun dug · {Math.round(debt / 100)} RSD
              </button>
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(debt / 200)))}
                className="rounded-md border border-border bg-card hover:bg-secondary px-2.5 py-1 text-xs transition-colors tabular-nums"
              >
                Pola · {Math.round(debt / 200)} RSD
              </button>
            </div>
          )}
        </div>

        {/* Date + Method */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="paid_at" className="text-xs">
              <CalendarDays
                className="size-3 inline -mt-0.5 mr-1"
                strokeWidth={1.75}
              />
              Datum
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
        <Button
          type="button"
          size="sm"
          disabled={pending || !studentId}
          onClick={onSubmit}
          className={cn()}
        >
          {pending ? "Čuvanje..." : "Evidentiraj uplatu"}
        </Button>
      </DialogFooter>
    </div>
  );
}
