"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Loader2,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CurriculumUnit,
  CurriculumWithUnits,
} from "@/lib/curriculum/types";
import {
  addUnitAction,
  deleteUnitAction,
  getCurriculumImpactAction,
  getUnitImpactAction,
  reorderUnitsAction,
  softDeleteCurriculumAction,
  updateCurriculumAction,
  updateUnitAction,
} from "@/lib/curriculum/actions";

type Section = CurriculumUnit & { children: CurriculumUnit[] };

function tree(units: CurriculumUnit[]): Section[] {
  const sections = units
    .filter((u) => u.parent_unit_id === null)
    .sort((a, b) => a.order_index - b.order_index);
  return sections.map((s) => ({
    ...s,
    children: units
      .filter((u) => u.parent_unit_id === s.id)
      .sort((a, b) => a.order_index - b.order_index),
  }));
}

export function CurriculumEditor({
  curriculum,
  subjectSuggestions,
}: {
  curriculum: CurriculumWithUnits;
  subjectSuggestions: string[];
}) {
  const [name, setName] = useState(curriculum.name);
  const [subject, setSubject] = useState(curriculum.subject);
  const [grade, setGrade] = useState(curriculum.grade_label ?? "");
  const [description, setDescription] = useState(curriculum.description ?? "");
  const [isActive, setIsActive] = useState(curriculum.is_active);
  const [units, setUnits] = useState<CurriculumUnit[]>(curriculum.units);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = tree(units);
  const subtopicCount = units.filter((u) => u.parent_unit_id !== null).length;

  // Header field autosave (debounced).
  useDebouncedEffect(
    () => {
      const init =
        name === curriculum.name &&
        subject === curriculum.subject &&
        (grade || null) === (curriculum.grade_label ?? null) &&
        (description || null) === (curriculum.description ?? null);
      if (init) return;
      void saveHeader({
        id: curriculum.id,
        name,
        subject,
        grade_label: grade || null,
        description: description || null,
      });
    },
    400,
    [name, subject, grade, description],
  );

  async function saveHeader(input: Parameters<typeof updateCurriculumAction>[0]) {
    setSaving(true);
    setError(null);
    const res = await updateCurriculumAction(input);
    setSaving(false);
    if (!res.ok) setError(res.error);
    else setSavedAt(Date.now());
  }

  async function toggleActive() {
    const next = !isActive;
    setIsActive(next);
    const res = await updateCurriculumAction({ id: curriculum.id, is_active: next });
    if (!res.ok) {
      setError(res.error);
      setIsActive(!next);
    } else {
      setSavedAt(Date.now());
    }
  }

  async function handleDelete() {
    const impact = await getCurriculumImpactAction(curriculum.id);
    const lines = ["Obrisati kurikulum?"];
    if (impact.units > 0) {
      lines.push(`• ${impact.units} sekcija/podtema će biti uklonjeno`);
    }
    if (impact.assignedStudents > 0) {
      lines.push(
        `• Dodeljen je ${impact.assignedStudents} ${impact.assignedStudents === 1 ? "učeniku" : "učenika"} — svi će izgubiti pristup`,
      );
    }
    lines.push("", "Ova akcija se ne može poništiti.");
    if (!confirm(lines.join("\n"))) return;
    await softDeleteCurriculumAction(curriculum.id);
  }

  /* ---------- Unit ops (optimistic) ---------- */

  async function addSection() {
    const tmpId = `tmp-${Date.now()}`;
    const optimistic: CurriculumUnit = {
      id: tmpId,
      curriculum_id: curriculum.id,
      parent_unit_id: null,
      title: "Nova sekcija",
      description: null,
      order_index:
        units.filter((u) => u.parent_unit_id === null).reduce((m, u) => Math.max(m, u.order_index), -1) + 1,
      est_lessons: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUnits((u) => [...u, optimistic]);
    const res = await addUnitAction({
      curriculumId: curriculum.id,
      parentUnitId: null,
      title: "Nova sekcija",
    });
    if (res.ok) {
      setUnits((u) =>
        u.map((x) => (x.id === tmpId ? { ...x, id: res.unitId } : x)),
      );
    } else {
      setUnits((u) => u.filter((x) => x.id !== tmpId));
      setError(res.error);
    }
  }

  async function addSubtopic(sectionId: string) {
    const tmpId = `tmp-${Date.now()}`;
    const siblings = units.filter((u) => u.parent_unit_id === sectionId);
    const optimistic: CurriculumUnit = {
      id: tmpId,
      curriculum_id: curriculum.id,
      parent_unit_id: sectionId,
      title: "Nova podtema",
      description: null,
      order_index: siblings.reduce((m, u) => Math.max(m, u.order_index), -1) + 1,
      est_lessons: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUnits((u) => [...u, optimistic]);
    const res = await addUnitAction({
      curriculumId: curriculum.id,
      parentUnitId: sectionId,
      title: "Nova podtema",
    });
    if (res.ok) {
      setUnits((u) =>
        u.map((x) => (x.id === tmpId ? { ...x, id: res.unitId } : x)),
      );
    } else {
      setUnits((u) => u.filter((x) => x.id !== tmpId));
      setError(res.error);
    }
  }

  async function deleteUnit(id: string) {
    if (id.startsWith("tmp-")) return;
    const impact = await getUnitImpactAction(id);
    const lines = ["Obrisati ovu jedinicu?"];
    if (impact.children > 0) {
      lines.push(
        `• ${impact.children} ${impact.children === 1 ? "podtema" : "podtema"} unutar nje će biti uklonjena`,
      );
    }
    if (impact.lessonsLinked > 0) {
      lines.push(
        `• Veza ka ${impact.lessonsLinked} ${impact.lessonsLinked === 1 ? "času" : "časova"} će biti raskinuta (sami časovi ostaju)`,
      );
    }
    if (!confirm(lines.join("\n"))) return;
    const prev = units;
    setUnits((u) => u.filter((x) => x.id !== id && x.parent_unit_id !== id));
    const res = await deleteUnitAction(id);
    if (!res.ok) {
      setUnits(prev);
      setError(res.error);
    }
  }

  // ----- Pointer-events DnD state ---------------------------------------
  // We re-shuffle local state as the user drags so reorder is live, then
  // persist on pointerup. Touch-friendly (touch-action: none on handles).
  const [dragging, setDragging] = useState<{
    id: string;
    kind: "section" | "subtopic";
    parentId: string | null;
  } | null>(null);

  function startDrag(
    e: React.PointerEvent,
    id: string,
    kind: "section" | "subtopic",
    parentId: string | null,
  ) {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging({ id, kind, parentId });
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragging) return;
    const selector =
      dragging.kind === "section"
        ? `[data-drag-row][data-drag-kind="section"]`
        : `[data-drag-row][data-drag-kind="subtopic"][data-drag-parent="${dragging.parentId}"]`;
    const rows = [
      ...document.querySelectorAll<HTMLElement>(selector),
    ];
    const draggedIdx = rows.findIndex((r) => r.dataset.dragRow === dragging.id);
    if (draggedIdx === -1) return;
    // Find target index by comparing pointer Y to row mid-Ys.
    let targetIdx = rows.length - 1;
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i]!.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === draggedIdx) return;
    // Optimistic local reorder.
    reorderInPlace(dragging.id, targetIdx);
  }

  function endDrag() {
    setDragging(null);
  }

  /**
   * Move `id` so its order among peers becomes `targetIdx`. Peers = siblings
   * with the same `parent_unit_id`. Renumbers compactly (0..N-1) and persists.
   * Called from the pointer-events DnD handlers.
   */
  async function reorderInPlace(id: string, targetIdx: number) {
    const target = units.find((u) => u.id === id);
    if (!target) return;
    const peers = units
      .filter((u) => u.parent_unit_id === target.parent_unit_id)
      .sort((a, b) => a.order_index - b.order_index);
    const curIdx = peers.findIndex((p) => p.id === id);
    if (curIdx === -1 || curIdx === targetIdx) return;
    const reordered = [...peers];
    const [moved] = reordered.splice(curIdx, 1);
    reordered.splice(Math.min(targetIdx, reordered.length), 0, moved!);
    const updates = reordered.map((p, i) => ({ id: p.id, order_index: i }));
    const updateMap = new Map(updates.map((u) => [u.id, u.order_index]));
    setUnits((cur) =>
      cur.map((u) => {
        const nIdx = updateMap.get(u.id);
        return nIdx !== undefined ? { ...u, order_index: nIdx } : u;
      }),
    );
    const res = await reorderUnitsAction(curriculum.id, updates);
    if (!res.ok) setError(res.error);
  }

  function patchUnitLocal(id: string, patch: Partial<CurriculumUnit>) {
    setUnits((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function saveUnitField(id: string, patch: Partial<CurriculumUnit>) {
    if (id.startsWith("tmp-")) return;
    const res = await updateUnitAction({
      id,
      title: patch.title,
      description: patch.description,
      est_lessons: patch.est_lessons,
    });
    if (!res.ok) setError(res.error);
    else setSavedAt(Date.now());
  }

  // Pending title saves per unit id (debounced).
  const titleTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const queueTitleSave = useCallback((id: string, title: string) => {
    if (id.startsWith("tmp-")) return;
    const existing = titleTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      titleTimers.current.delete(id);
      void saveUnitField(id, { title });
    }, 600);
    titleTimers.current.set(id, t);
  }, []);

  useEffect(() => {
    const timers = titleTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="card-elevated card-glow rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Naziv kurikuluma"
              className="font-display text-2xl bg-transparent outline-none border-b border-transparent focus:border-brand/40 w-full"
            />
            {(sections.length > 0 || subtopicCount > 0) && (
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                {sections.length} {sections.length === 1 ? "sekcija" : "sekcija"}
                {subtopicCount > 0 ? ` · ${subtopicCount} ${subtopicCount === 1 ? "podtema" : "podtema"}` : ""}
              </p>
            )}
          </div>
          <SaveBadge saving={saving} savedAt={savedAt} error={error} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Predmet">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="npr. Matematika"
              list="curriculum-subjects"
              className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-sm outline-none focus:bg-secondary border border-border/60 focus:border-brand/40"
            />
            <datalist id="curriculum-subjects">
              {subjectSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Razred / nivo">
            <input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="npr. 8. razred OŠ"
              className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-sm outline-none focus:bg-secondary border border-border/60 focus:border-brand/40"
            />
          </Field>
        </div>

        <Field label="Opis (opciono)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Šta ovaj kurikulum pokriva, za koga je…"
            rows={2}
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-sm outline-none focus:bg-secondary border border-border/60 focus:border-brand/40 resize-none"
          />
        </Field>

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={toggleActive}
              className="size-4 rounded accent-brand"
            />
            <span>Aktivan — vidljiv u biraču za dodelu</span>
          </label>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Obriši kurikulum
          </button>
        </div>
      </div>

      {/* SECTIONS */}
      <div className="space-y-3">
        {sections.length === 0 && (
          <div className="card-elevated rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Još nema sekcija. Dodaj prvu sekciju da krene kurikulum.
            </p>
          </div>
        )}
        {sections.map((s) => (
          <SectionCard
            key={s.id}
            section={s}
            isDragging={dragging?.id === s.id}
            onDragStart={(e) => startDrag(e, s.id, "section", null)}
            onDragMove={onDragMove}
            onDragEnd={endDrag}
            onTitle={(title) => {
              patchUnitLocal(s.id, { title });
              queueTitleSave(s.id, title);
            }}
            onTitleBlur={(title) => saveUnitField(s.id, { title })}
            onDelete={() => deleteUnit(s.id)}
            onAddSubtopic={() => addSubtopic(s.id)}
            onSubtopicTitle={(id, title) => {
              patchUnitLocal(id, { title });
              queueTitleSave(id, title);
            }}
            onSubtopicBlur={(id, title) => saveUnitField(id, { title })}
            onSubtopicDelete={(id) => deleteUnit(id)}
            onSubtopicDragStart={(e, id) => startDrag(e, id, "subtopic", s.id)}
            onSubtopicDragMove={onDragMove}
            onSubtopicDragEnd={endDrag}
            draggingSubtopicId={
              dragging?.kind === "subtopic" && dragging.parentId === s.id
                ? dragging.id
                : null
            }
            onEstLessons={(id, n) => {
              patchUnitLocal(id, { est_lessons: n });
              saveUnitField(id, { est_lessons: n });
            }}
          />
        ))}

        <button
          type="button"
          onClick={addSection}
          className="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-2xl border-2 border-dashed border-border hover:border-brand/40 hover:bg-brand/5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-4" strokeWidth={2} />
          Dodaj sekciju
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTitle,
  onTitleBlur,
  onDelete,
  onAddSubtopic,
  onSubtopicTitle,
  onSubtopicBlur,
  onSubtopicDelete,
  onSubtopicDragStart,
  onSubtopicDragMove,
  onSubtopicDragEnd,
  draggingSubtopicId,
  onEstLessons,
}: {
  section: Section;
  isDragging: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: () => void;
  onTitle: (s: string) => void;
  onTitleBlur: (s: string) => void;
  onDelete: () => void;
  onAddSubtopic: () => void;
  onSubtopicTitle: (id: string, s: string) => void;
  onSubtopicBlur: (id: string, s: string) => void;
  onSubtopicDelete: (id: string) => void;
  onSubtopicDragStart: (e: React.PointerEvent, id: string) => void;
  onSubtopicDragMove: (e: React.PointerEvent) => void;
  onSubtopicDragEnd: () => void;
  draggingSubtopicId: string | null;
  onEstLessons: (id: string, n: number | null) => void;
}) {
  return (
    <div
      data-drag-row={section.id}
      data-drag-kind="section"
      className={cn(
        "card-elevated card-glow rounded-2xl p-4 space-y-3 transition-all",
        isDragging && "ring-2 ring-brand/60 opacity-75 scale-[1.01] shadow-xl",
      )}
    >
      <div className="flex items-center gap-2">
        <DragHandle
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          title="Prevuci da promeniš redosled"
        />
        <input
          value={section.title}
          onChange={(e) => onTitle(e.target.value)}
          onBlur={(e) => onTitleBlur(e.target.value)}
          placeholder="Naziv sekcije"
          className="font-display text-lg flex-1 bg-transparent outline-none border-b border-transparent focus:border-brand/40"
        />
        <IconBtn onClick={onDelete} title="Obriši sekciju" danger>
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </IconBtn>
      </div>

      {section.children.length > 0 && (
        <ul className="space-y-1.5 pl-6 border-l border-border/60 ml-1">
          {section.children.map((sub) => (
            <li
              key={sub.id}
              data-drag-row={sub.id}
              data-drag-kind="subtopic"
              data-drag-parent={section.id}
              className={cn(
                "flex items-center gap-1.5 group transition-all",
                draggingSubtopicId === sub.id &&
                  "ring-2 ring-brand/50 rounded-md bg-brand/5 opacity-80",
              )}
            >
              <DragHandle
                small
                onPointerDown={(e) => onSubtopicDragStart(e, sub.id)}
                onPointerMove={onSubtopicDragMove}
                onPointerUp={onSubtopicDragEnd}
                onPointerCancel={onSubtopicDragEnd}
                title="Prevuci"
              />
              <ChevronRight
                className="size-3 text-muted-foreground/40 shrink-0"
                strokeWidth={2}
              />
              <input
                value={sub.title}
                onChange={(e) => onSubtopicTitle(sub.id, e.target.value)}
                onBlur={(e) => onSubtopicBlur(sub.id, e.target.value)}
                placeholder="Naziv podteme"
                className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-brand/40 py-1"
              />
              <input
                type="number"
                min={1}
                max={20}
                value={sub.est_lessons ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onEstLessons(sub.id, v ? Number(v) : null);
                }}
                placeholder="~"
                title="Procena časova"
                className="w-12 bg-transparent text-xs text-muted-foreground text-center outline-none border border-transparent focus:border-brand/40 rounded py-0.5"
              />
              <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <IconBtn
                  onClick={() => onSubtopicDelete(sub.id)}
                  title="Obriši"
                  danger
                >
                  <Trash2 className="size-3" strokeWidth={1.75} />
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAddSubtopic}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1 px-2 rounded hover:bg-secondary/60 transition-colors"
      >
        <Plus className="size-3" strokeWidth={2} />
        Dodaj podtemu
      </button>
    </div>
  );
}

function DragHandle({
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  title,
  small = false,
}: {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  title: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={cn(
        "inline-flex items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-secondary cursor-grab active:cursor-grabbing transition-colors shrink-0",
        small ? "size-5" : "size-6",
      )}
      style={{ touchAction: "none" }}
    >
      <GripVertical className={small ? "size-3" : "size-3.5"} strokeWidth={2} />
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center justify-center size-6 rounded text-muted-foreground transition-colors",
        !disabled && !danger && "hover:bg-secondary hover:text-foreground",
        !disabled && danger && "hover:bg-destructive/10 hover:text-destructive",
        disabled && "opacity-30 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

function SaveBadge({
  saving,
  savedAt,
  error,
}: {
  saving: boolean;
  savedAt: number | null;
  error: string | null;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (savedAt) {
      const t = setTimeout(() => setTick((x) => x + 1), 2000);
      return () => clearTimeout(t);
    }
  }, [savedAt]);
  const recent = savedAt && Date.now() - savedAt < 2000;
  // tick triggers re-render so badge fades; reference to avoid lint
  void tick;

  if (error) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive">
        <AlertTriangle className="size-3" strokeWidth={2} />
        {error.slice(0, 60)}
      </span>
    );
  }
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" strokeWidth={2} />
        Čuvanje…
      </span>
    );
  }
  if (recent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-500 dark:text-emerald-400 animate-in fade-in">
        <Check className="size-3" strokeWidth={2.5} />
        Sačuvano
      </span>
    );
  }
  return null;
}

function useDebouncedEffect(
  effect: () => void,
  delay: number,
  deps: React.DependencyList,
) {
  const fnRef = useRef(effect);
  fnRef.current = effect;
  useEffect(() => {
    const t = setTimeout(() => fnRef.current(), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
