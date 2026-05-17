"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, Plus, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CurriculumSummary,
  StudentPlan,
  StudentPlanCurriculum,
} from "@/lib/curriculum/types";
import { assignCurriculumAction } from "@/lib/curriculum/actions";
import { PlanJourney } from "./plan-journey";

export function PlanTab({
  studentId,
  studentName,
  plan,
  availableCurricula,
}: {
  studentId: string;
  studentName: string;
  plan: StudentPlan;
  availableCurricula: CurriculumSummary[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Don't show already-assigned curricula in picker.
  const assignedIds = new Set(plan.active.map((a) => a.curriculum.id));
  const pickable = availableCurricula.filter((c) => !assignedIds.has(c.id));

  if (plan.active.length === 0) {
    return (
      <EmptyState
        hasCurricula={availableCurricula.length > 0}
        onAssign={() => setPickerOpen(true)}
        picker={
          pickerOpen && (
            <CurriculumPickerDialog
              studentId={studentId}
              studentName={studentName}
              curricula={pickable}
              onClose={() => setPickerOpen(false)}
            />
          )
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <CurriculaSwitcher
        active={plan.active}
        onAddClick={() => setPickerOpen(true)}
        canAdd={pickable.length > 0}
      />
      {pickerOpen && (
        <CurriculumPickerDialog
          studentId={studentId}
          studentName={studentName}
          curricula={pickable}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function CurriculaSwitcher({
  active,
  onAddClick,
  canAdd,
}: {
  active: StudentPlanCurriculum[];
  onAddClick: () => void;
  canAdd: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = active[activeIdx] ?? active[0];
  if (!current) return null;

  return (
    <div className="space-y-4">
      {active.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap p-1 rounded-xl bg-secondary/40 border border-border/60 w-fit">
          {active.map((a, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={a.assignment.id}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {a.curriculum.name}
              </button>
            );
          })}
          {canAdd && (
            <button
              onClick={onAddClick}
              title="Dodeli još jedan kurikulum"
              className="ml-1 inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              <Plus className="size-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      )}
      {active.length === 1 && canAdd && (
        <button
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-3" strokeWidth={2} />
          Dodeli još jedan kurikulum
        </button>
      )}

      <PlanJourney key={current.assignment.id} planItem={current} />
    </div>
  );
}

function EmptyState({
  hasCurricula,
  onAssign,
  picker,
}: {
  hasCurricula: boolean;
  onAssign: () => void;
  picker: React.ReactNode;
}) {
  return (
    <>
      <div className="card-elevated card-glow rounded-2xl p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl tile-violet mb-4">
          <Compass className="size-7" strokeWidth={1.75} />
        </div>
        <h2 className="font-display text-2xl text-foreground mb-2">
          Bez plana učenja
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
          {hasCurricula
            ? "Dodeli kurikulum ovom učeniku da ga vidiš na vizuelnoj mapi i pratiš napredak po temama."
            : "Napravi prvi kurikulum — predmet i razred sa redosledom tema. Onda ga dodeli učenicima da pratiš gradivo kroz lekcije."}
        </p>
        {hasCurricula ? (
          <button
            type="button"
            onClick={onAssign}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
          >
            <Layers className="size-3.5" strokeWidth={2.25} />
            Dodeli kurikulum
          </button>
        ) : (
          <Link
            href="/curricula/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
          >
            <Plus className="size-3.5" strokeWidth={2.25} />
            Napravi prvi kurikulum
          </Link>
        )}
      </div>
      {picker}
    </>
  );
}

function CurriculumPickerDialog({
  studentId,
  studentName,
  curricula,
  onClose,
}: {
  studentId: string;
  studentName: string;
  curricula: CurriculumSummary[];
  onClose: () => void;
}) {
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(curriculumId: string) {
    setAssigning(curriculumId);
    setError(null);
    const res = await assignCurriculumAction(studentId, curriculumId);
    if (!res.ok) {
      setError(res.error);
      setAssigning(null);
    }
    // On success, revalidation will swap the UI; close.
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-foreground">
              Dodeli kurikulum
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              za {studentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
        <div className="p-3 max-h-[60vh] overflow-y-auto">
          {curricula.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nema dostupnih aktivnih kurikuluma.{" "}
              <Link
                href="/curricula/new"
                className="text-brand hover:underline font-medium"
              >
                Napravi novi
              </Link>
              .
            </div>
          ) : (
            <ul className="space-y-1">
              {curricula.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => pick(c.id)}
                    disabled={assigning !== null}
                    className={cn(
                      "w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors",
                      assigning === c.id
                        ? "bg-brand/10"
                        : "hover:bg-secondary/60",
                      assigning !== null && assigning !== c.id && "opacity-50",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg tile-violet">
                      <Compass className="size-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[c.subject, c.grade_label].filter(Boolean).join(" · ") ||
                          "—"}
                        {" · "}
                        {c.units_count} tema
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && (
          <div className="px-5 py-3 border-t border-border bg-destructive/5 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
