"use client";

import { useState } from "react";
import {
  CalendarPlus,
  Banknote,
  CalendarClock,
  CalendarX,
  ClipboardList,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  executeProposalAction,
  type HistoryMessage,
} from "@/lib/assistant/chat";
import type { Proposal } from "./types";

const ICONS: Record<Proposal["type"], typeof CalendarPlus> = {
  create_lesson: CalendarPlus,
  mark_payment: Banknote,
  reschedule_lesson: CalendarClock,
  cancel_lesson: CalendarX,
  add_homework: ClipboardList,
};

const TITLES: Record<Proposal["type"], string> = {
  create_lesson: "Kreiraj čas",
  mark_payment: "Upiši uplatu",
  reschedule_lesson: "Pomeri termin",
  cancel_lesson: "Otkaži čas",
  add_homework: "Zadaj domaći",
};

export function ProposalCard({
  proposal,
  state,
  onResolved,
}: {
  proposal: Proposal;
  state: "pending" | "confirmed" | "rejected";
  onResolved: (
    state: "confirmed" | "rejected",
    payload?: {
      message?: string;
      newTurns?: HistoryMessage[];
      error?: string;
    },
  ) => void;
}) {
  const [pending, setPending] = useState(false);
  const Icon = ICONS[proposal.type];

  async function confirm() {
    setPending(true);
    const res = await executeProposalAction({ proposal });
    setPending(false);
    if (res.ok) {
      onResolved("confirmed", {
        message: res.message,
        newTurns: res.newTurns,
      });
    } else {
      onResolved("rejected", { error: res.error });
    }
  }

  function reject() {
    onResolved("rejected");
  }

  return (
    <div
      className={`rounded-lg border p-3 my-2 ${
        state === "confirmed"
          ? "border-emerald-300 bg-emerald-50"
          : state === "rejected"
            ? "border-border bg-secondary/30 opacity-60"
            : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`size-8 rounded-md flex items-center justify-center shrink-0 ${
            state === "confirmed"
              ? "bg-emerald-200 text-emerald-900"
              : "bg-amber-200 text-amber-900"
          }`}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">
            {TITLES[proposal.type]}
          </p>
          <SummaryRender summary={proposal.summary} type={proposal.type} />

          {state === "pending" && (
            <div className="flex items-center gap-1.5 mt-3">
              <Button
                type="button"
                size="sm"
                onClick={confirm}
                disabled={pending}
                className="h-7"
              >
                {pending ? (
                  <Loader2 className="size-3 animate-spin" strokeWidth={2} />
                ) : (
                  <Check className="size-3" strokeWidth={2.5} />
                )}
                Potvrdi
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={reject}
                disabled={pending}
                className="h-7"
              >
                <X className="size-3" strokeWidth={2} />
                Odustani
              </Button>
            </div>
          )}
          {state === "confirmed" && (
            <p className="text-[10px] text-emerald-700 mt-2 inline-flex items-center gap-1">
              <Check className="size-2.5" strokeWidth={2.5} />
              Potvrđeno
            </p>
          )}
          {state === "rejected" && (
            <p className="text-[10px] text-muted-foreground mt-2">Odbijeno</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRender({
  summary,
  type,
}: {
  summary: Record<string, unknown>;
  type: Proposal["type"];
}) {
  const lines: string[] = [];

  if (type === "create_lesson") {
    if (summary.student_name) lines.push(`Učenik: ${summary.student_name}`);
    if (summary.when) lines.push(`Kad: ${summary.when}`);
    if (summary.duration_min) lines.push(`Trajanje: ${summary.duration_min} min`);
    if (summary.price_rsd !== undefined)
      lines.push(`Cena: ${Number(summary.price_rsd).toLocaleString("sr-Latn-RS")} RSD`);
  } else if (type === "mark_payment") {
    if (summary.student_name) lines.push(`Učenik: ${summary.student_name}`);
    if (summary.amount_rsd !== undefined)
      lines.push(
        `Iznos: ${Number(summary.amount_rsd).toLocaleString("sr-Latn-RS")} RSD`,
      );
    if (summary.when) lines.push(`Datum: ${summary.when}`);
    if (summary.method) lines.push(`Način: ${summary.method}`);
    if (summary.note) lines.push(`Napomena: ${summary.note}`);
  } else if (type === "reschedule_lesson") {
    if (summary.student_name) lines.push(`Učenik: ${summary.student_name}`);
    if (summary.old_when) lines.push(`Bilo: ${summary.old_when}`);
    if (summary.new_when) lines.push(`Novo: ${summary.new_when}`);
  } else if (type === "cancel_lesson") {
    if (summary.student_name) lines.push(`Učenik: ${summary.student_name}`);
    if (summary.when) lines.push(`Kad: ${summary.when}`);
    if (summary.reason_label) lines.push(`Razlog: ${summary.reason_label}`);
  } else if (type === "add_homework") {
    if (summary.student_name) lines.push(`Učenik: ${summary.student_name}`);
    if (summary.title) lines.push(`Naslov: ${summary.title}`);
    if (summary.description) lines.push(`Opis: ${summary.description}`);
    if (summary.due_date) lines.push(`Rok: ${summary.due_date}`);
  }

  return (
    <ul className="text-[11px] text-foreground/80 space-y-0.5 mt-1.5">
      {lines.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}
