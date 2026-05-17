"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  CircleDot,
  Circle,
  SkipForward,
  Compass,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentPickableUnit } from "@/lib/curriculum/queries";
import {
  listStudentPickableUnitsAction,
  updateUnitStatusAction,
} from "@/lib/curriculum/actions";

export function UnitPicker({
  studentId,
  selected,
  onChange,
  onUnitsLoaded,
}: {
  studentId: string;
  selected: string[];
  onChange: (next: string[]) => void;
  onUnitsLoaded?: (units: StudentPickableUnit[]) => void;
}) {
  const [units, setUnits] = useState<StudentPickableUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await listStudentPickableUnitsAction(studentId);
      if (cancelled) return;
      setUnits(data);
      onUnitsLoaded?.(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // onUnitsLoaded intentionally excluded — caller can wrap in useCallback if needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // Group by curriculum → section.
  const grouped = useMemo(() => {
    const byCurriculum = new Map<
      string,
      { name: string; sections: Map<string, StudentPickableUnit[]> }
    >();
    for (const u of units) {
      if (!byCurriculum.has(u.curriculum_id)) {
        byCurriculum.set(u.curriculum_id, {
          name: u.curriculum_name,
          sections: new Map(),
        });
      }
      const entry = byCurriculum.get(u.curriculum_id)!;
      const sec = u.section_title ?? "—";
      if (!entry.sections.has(sec)) entry.sections.set(sec, []);
      entry.sections.get(sec)!.push(u);
    }
    return byCurriculum;
  }, [units]);

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground">Učitavanje tema…</div>
    );
  }
  if (units.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        Ovaj učenik nema dodeljenih kurikuluma. Otvori Plan tab da dodeliš.
      </div>
    );
  }

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-3">
      {[...grouped.entries()].map(([curriculumId, group]) => (
        <div key={curriculumId} className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
            <Compass className="size-3" strokeWidth={2} />
            {group.name}
          </div>
          <div className="space-y-2">
            {[...group.sections.entries()].map(([sec, items]) => (
              <div key={sec} className="space-y-1">
                {sec !== "—" && (
                  <div className="text-[11px] text-muted-foreground/70 pl-1">
                    {sec}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {items.map((u) => (
                    <UnitChip
                      key={u.unit_id}
                      unit={u}
                      active={selected.includes(u.unit_id)}
                      onClick={() => toggle(u.unit_id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function UnitChip({
  unit,
  active,
  onClick,
}: {
  unit: StudentPickableUnit;
  active: boolean;
  onClick: () => void;
}) {
  const Icon =
    unit.status === "mastered"
      ? Check
      : unit.status === "in_progress"
        ? CircleDot
        : unit.status === "skipped"
          ? SkipForward
          : Circle;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
        active
          ? "bg-brand/15 border-brand text-foreground"
          : "bg-secondary/30 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60",
        unit.status === "mastered" &&
          !active &&
          "text-emerald-600 dark:text-emerald-400",
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {unit.unit_title}
    </button>
  );
}

/**
 * "Sad savladano" pills — shown below the picker for currently-linked units
 * whose progress is `in_progress`. One click flips that unit to mastered.
 */
export function MasterPills({
  studentId,
  selectedUnitIds,
  units,
  onMastered,
}: {
  studentId: string;
  selectedUnitIds: string[];
  units: StudentPickableUnit[];
  onMastered: (unitId: string) => void;
}) {
  const candidates = units.filter(
    (u) => selectedUnitIds.includes(u.unit_id) && u.status === "in_progress",
  );
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (candidates.length === 0) return null;

  function markMastered(unit: StudentPickableUnit) {
    setBusyId(unit.unit_id);
    start(async () => {
      const res = await updateUnitStatusAction({
        studentCurriculumId: unit.student_curriculum_id,
        unitId: unit.unit_id,
        status: "mastered",
        studentId,
      });
      setBusyId(null);
      if (res.ok) onMastered(unit.unit_id);
    });
  }

  return (
    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5">
        <Sparkles className="size-3" strokeWidth={2} />
        Sad savladano?
      </div>
      <div className="flex flex-wrap gap-1.5">
        {candidates.map((u) => (
          <button
            key={u.unit_id}
            type="button"
            onClick={() => markMastered(u)}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15",
              busyId === u.unit_id && "opacity-60",
            )}
          >
            <Check className="size-3" strokeWidth={2.5} />
            {u.unit_title}
          </button>
        ))}
      </div>
    </div>
  );
}
