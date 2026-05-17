"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  Circle,
  CircleDot,
  X,
  SkipForward,
  Sparkles,
  ChevronRight,
  Trash2,
  CalendarDays,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLessonsForUnitAction,
  markSectionMasteredAction,
  updateUnitStatusAction,
  updateUnitNotesAction,
  unassignCurriculumAction,
} from "@/lib/curriculum/actions";
import type { UnitLesson } from "@/lib/curriculum/queries";
import {
  UNIT_STATUS_LABELS,
  type CurriculumUnit,
  type StudentPlanCurriculum,
  type StudentUnitProgress,
  type UnitStatus,
} from "@/lib/curriculum/types";

type SectionNode = CurriculumUnit & {
  children: CurriculumUnit[];
};

type DerivedStatus = UnitStatus;

function statusFor(
  unitId: string,
  progress: StudentUnitProgress[],
): DerivedStatus {
  return progress.find((p) => p.unit_id === unitId)?.status ?? "not_started";
}

/**
 * Derived status for a section (parent unit):
 *   - no children   → own status
 *   - all mastered/skipped → mastered
 *   - any in_progress, or some mastered but not all → in_progress
 *   - else → not_started
 */
function sectionStatus(
  section: SectionNode,
  progress: StudentUnitProgress[],
): DerivedStatus {
  if (section.children.length === 0) return statusFor(section.id, progress);
  const childStatuses = section.children.map((c) => statusFor(c.id, progress));
  const allDone = childStatuses.every(
    (s) => s === "mastered" || s === "skipped",
  );
  if (allDone) return "mastered";
  const anyTouched = childStatuses.some(
    (s) => s === "in_progress" || s === "mastered",
  );
  return anyTouched ? "in_progress" : "not_started";
}

export function PlanJourney({
  planItem,
}: {
  planItem: StudentPlanCurriculum;
}) {
  const { curriculum, units, progress, assignment } = planItem;

  const sections: SectionNode[] = useMemo(() => {
    const roots = units
      .filter((u) => u.parent_unit_id === null)
      .sort((a, b) => a.order_index - b.order_index);
    return roots.map((r) => ({
      ...r,
      children: units
        .filter((u) => u.parent_unit_id === r.id)
        .sort((a, b) => a.order_index - b.order_index),
    }));
  }, [units]);

  // Stats for header bar.
  const stats = useMemo(() => {
    // Leaf units (subtopics) + childless sections count as trackable nodes.
    const leaves: CurriculumUnit[] = sections.flatMap((s) =>
      s.children.length > 0 ? s.children : [s],
    );
    const total = leaves.length;
    let mastered = 0;
    let inProgress = 0;
    let currentTitle: string | null = null;
    for (const u of leaves) {
      const s = statusFor(u.id, progress);
      if (s === "mastered") mastered++;
      else if (s === "in_progress") {
        inProgress++;
        if (!currentTitle) currentTitle = u.title;
      }
    }
    const pct = total === 0 ? 0 : Math.round((mastered / total) * 100);
    return { total, mastered, inProgress, currentTitle, pct };
  }, [sections, progress]);

  const [selected, setSelected] = useState<{
    unit: CurriculumUnit;
    breadcrumb: string[];
    isSection: boolean;
    sectionChildren: CurriculumUnit[];
  } | null>(null);

  function openUnit(unit: CurriculumUnit) {
    const parent = sections.find(
      (s) => s.id === unit.id || s.children.some((c) => c.id === unit.id),
    );
    const breadcrumb: string[] = [];
    if (parent && parent.id !== unit.id) breadcrumb.push(parent.title);
    breadcrumb.push(unit.title);
    const isSection = unit.parent_unit_id === null;
    const sectionChildren = isSection
      ? (sections.find((s) => s.id === unit.id)?.children ?? [])
      : [];
    setSelected({ unit, breadcrumb, isSection, sectionChildren });
  }

  return (
    <>
      <PlanHeader
        curriculum={curriculum}
        stats={stats}
        assignmentId={assignment.id}
        studentId={planItem.assignment.student_id}
      />

      {sections.length === 0 ? (
        <div className="card-elevated rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Ovaj kurikulum je još prazan.{" "}
          <a
            href={`/curricula/${curriculum.id}`}
            className="text-brand font-medium hover:underline"
          >
            Otvori editor
          </a>{" "}
          i dodaj prvu sekciju.
        </div>
      ) : (
        <nav aria-label="Plan učenika" className="relative">
          <ol className="space-y-3">
            {sections.map((section, idx) => (
              <Station
                key={section.id}
                section={section}
                progress={progress}
                isFirst={idx === 0}
                isLast={idx === sections.length - 1}
                onSelect={openUnit}
              />
            ))}
          </ol>
        </nav>
      )}

      {selected && (
        <UnitPanel
          unit={selected.unit}
          breadcrumb={selected.breadcrumb}
          isSection={selected.isSection}
          sectionChildren={selected.sectionChildren}
          sectionProgress={progress}
          progress={progress.find((p) => p.unit_id === selected.unit.id) ?? null}
          studentCurriculumId={assignment.id}
          studentId={assignment.student_id}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

/* ---------- Header ---------- */

function PlanHeader({
  curriculum,
  stats,
  assignmentId,
  studentId,
}: {
  curriculum: StudentPlanCurriculum["curriculum"];
  stats: {
    total: number;
    mastered: number;
    inProgress: number;
    currentTitle: string | null;
    pct: number;
  };
  assignmentId: string;
  studentId: string;
}) {
  const [pending, start] = useTransition();
  function handleUnassign() {
    if (
      !confirm(
        "Ukloniti ovaj kurikulum sa učenika? Napredak ostaje sačuvan, ali kurikulum više neće biti aktivan.",
      )
    )
      return;
    start(async () => {
      await unassignCurriculumAction(assignmentId, studentId);
    });
  }

  return (
    <div className="card-elevated card-glow rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground">
            {curriculum.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {[curriculum.subject, curriculum.grade_label]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <button
          onClick={handleUnassign}
          disabled={pending}
          title="Ukloni kurikulum"
          className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl tabular-nums text-foreground">
              {stats.pct}%
            </span>
            <span className="text-xs text-muted-foreground">
              {stats.mastered} od {stats.total}{" "}
              {stats.total === 1 ? "teme" : "tema"}
            </span>
          </div>
          {stats.currentTitle && (
            <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
              <CircleDot
                className="size-3 text-brand animate-pulse"
                strokeWidth={2}
              />
              <span>
                trenutno:{" "}
                <span className="text-foreground font-medium">
                  {stats.currentTitle}
                </span>
              </span>
            </div>
          )}
        </div>
        <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand/70 transition-[width] duration-700 ease-out"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            {stats.mastered} savladano
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-brand animate-pulse" />
            {stats.inProgress} u toku
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            {stats.total - stats.mastered - stats.inProgress} preostalo
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Station (section) ---------- */

function Station({
  section,
  progress,
  isFirst,
  isLast,
  onSelect,
}: {
  section: SectionNode;
  progress: StudentUnitProgress[];
  isFirst: boolean;
  isLast: boolean;
  onSelect: (u: CurriculumUnit) => void;
}) {
  const status = sectionStatus(section, progress);
  const masteredCount = section.children.filter(
    (c) => statusFor(c.id, progress) === "mastered",
  ).length;
  const total = section.children.length;

  return (
    <li
      className={cn(
        "relative grid sm:grid-cols-[260px_1fr] gap-3 sm:gap-6 items-start",
      )}
    >
      {/* Connector line */}
      {!isLast && (
        <span
          aria-hidden
          className={cn(
            "absolute left-[19px] sm:left-[19px] top-12 bottom-[-1rem] w-[2px]",
            status === "mastered"
              ? "bg-gradient-to-b from-emerald-500/70 via-emerald-500/40 to-border"
              : status === "in_progress"
                ? "bg-gradient-to-b from-brand/60 via-brand/20 to-border/50"
                : "bg-border/60",
          )}
        />
      )}

      {/* Station bubble + label */}
      <button
        type="button"
        onClick={() => onSelect(section)}
        className={cn(
          "relative flex items-start gap-3 text-left group/station cursor-pointer transition-opacity hover:opacity-90",
        )}
      >
        <StatusBubble status={status} large />
        <div className="pt-1 min-w-0 flex-1">
          <div className="font-display text-lg text-foreground leading-tight">
            {section.title}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {total === 0 ? (
              UNIT_STATUS_LABELS[status]
            ) : (
              <>
                {status === "mastered"
                  ? `Savladano (${masteredCount}/${total})`
                  : status === "in_progress"
                    ? `U toku (${masteredCount}/${total})`
                    : `Nije počeo (0/${total})`}
              </>
            )}
          </div>
        </div>
      </button>

      {/* Subtopics — branch list */}
      {section.children.length > 0 && (
        <ul className="ml-11 sm:ml-0 space-y-1 sm:pt-2">
          {section.children.map((sub, i) => (
            <Subtopic
              key={sub.id}
              unit={sub}
              status={statusFor(sub.id, progress)}
              isFirstInBranch={i === 0}
              onSelect={() => onSelect(sub)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function Subtopic({
  unit,
  status,
  isFirstInBranch,
  onSelect,
}: {
  unit: CurriculumUnit;
  status: UnitStatus;
  isFirstInBranch: boolean;
  onSelect: () => void;
}) {
  return (
    <li className="relative">
      {/* SVG branch curve on desktop — connects station to subtopic */}
      {isFirstInBranch && (
        <svg
          aria-hidden
          className="hidden sm:block absolute -left-[2.4rem] -top-3 w-9 h-6 text-border/60"
          viewBox="0 0 36 24"
          fill="none"
        >
          <path
            d="M0 0 Q 0 18 18 18 L 36 18"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      )}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group w-full flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg transition-all text-left",
          "hover:bg-secondary/60",
          status === "in_progress" && "bg-brand/5",
        )}
      >
        <StatusBubble status={status} />
        <span
          className={cn(
            "text-sm flex-1 min-w-0 truncate",
            status === "mastered" && "text-muted-foreground",
            status === "skipped" && "text-muted-foreground/60 line-through",
            status === "in_progress" && "text-foreground font-medium",
            status === "not_started" && "text-foreground/80",
          )}
        >
          {unit.title}
        </span>
        {unit.est_lessons && (
          <span className="text-[10px] text-muted-foreground/70 tabular-nums">
            ~{unit.est_lessons}č
          </span>
        )}
        <ChevronRight
          className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0"
          strokeWidth={2}
        />
      </button>
    </li>
  );
}

function StatusBubble({
  status,
  large = false,
}: {
  status: UnitStatus;
  large?: boolean;
}) {
  const size = large ? "size-10" : "size-5";
  const iconSize = large ? "size-5" : "size-3";
  if (status === "mastered") {
    return (
      <span
        aria-label="Savladano"
        className={cn(
          "inline-flex items-center justify-center rounded-full shrink-0",
          size,
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30",
        )}
      >
        <Check className={iconSize} strokeWidth={3} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        aria-label="U toku"
        className={cn(
          "relative inline-flex items-center justify-center rounded-full shrink-0",
          size,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full bg-brand/15 ring-2 ring-brand animate-pulse",
          )}
        />
        <CircleDot
          className={cn(iconSize, "relative text-brand")}
          strokeWidth={2.5}
        />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span
        aria-label="Preskočeno"
        className={cn(
          "inline-flex items-center justify-center rounded-full shrink-0",
          size,
          "bg-secondary/60 text-muted-foreground/60",
        )}
      >
        <SkipForward className={iconSize} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span
      aria-label="Nije počeo"
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0 bg-secondary/40 text-muted-foreground/40 ring-1 ring-border",
        size,
      )}
    >
      <Circle className={iconSize} strokeWidth={2} />
    </span>
  );
}

/* ---------- Unit panel (side / bottom sheet) ---------- */

function UnitPanel({
  unit,
  breadcrumb,
  isSection,
  sectionChildren,
  sectionProgress,
  progress,
  studentCurriculumId,
  studentId,
  onClose,
}: {
  unit: CurriculumUnit;
  breadcrumb: string[];
  isSection: boolean;
  sectionChildren: CurriculumUnit[];
  sectionProgress: StudentUnitProgress[];
  progress: StudentUnitProgress | null;
  studentCurriculumId: string;
  studentId: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<UnitStatus>(
    progress?.status ?? "not_started",
  );
  const [notes, setNotes] = useState(progress?.notes ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [unitLessons, setUnitLessons] = useState<UnitLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLessonsLoading(true);
    (async () => {
      const ls = await getLessonsForUnitAction(unit.id, studentId);
      if (!cancelled) {
        setUnitLessons(ls);
        setLessonsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unit.id, studentId]);

  function setStatusFn(next: UnitStatus) {
    const prev = status;
    setStatus(next);
    start(async () => {
      const res = await updateUnitStatusAction({
        studentCurriculumId,
        unitId: unit.id,
        status: next,
        studentId,
      });
      if (!res.ok) {
        setError(res.error);
        setStatus(prev);
      } else {
        setError(null);
      }
    });
  }

  function saveNotes() {
    start(async () => {
      const res = await updateUnitNotesAction({
        studentCurriculumId,
        unitId: unit.id,
        notes,
        studentId,
      });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/30 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full sm:w-[440px] bg-card border-t sm:border-l sm:border-t-0 border-border shadow-2xl",
          "rounded-t-2xl sm:rounded-none",
          "max-h-[88vh] sm:max-h-none sm:h-full overflow-y-auto",
          "animate-in slide-in-from-bottom sm:slide-in-from-right",
        )}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              {isSection
                ? "Sekcija"
                : breadcrumb.length > 1
                  ? breadcrumb.slice(0, -1).join(" ▸ ")
                  : "Sekcija"}
            </p>
            <h3 className="font-display text-xl text-foreground mt-0.5">
              {unit.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {unit.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {unit.description}
            </p>
          )}

          {isSection && sectionChildren.length > 0 ? (
            <SectionPanelBody
              sectionId={unit.id}
              sectionTitle={unit.title}
              children={sectionChildren}
              progress={sectionProgress}
              studentCurriculumId={studentCurriculumId}
              studentId={studentId}
              onError={setError}
            />
          ) : (
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-2">
                Status
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["not_started", "in_progress", "mastered", "skipped"] as const).map(
                  (s) => (
                    <StatusButton
                      key={s}
                      s={s}
                      active={status === s}
                      onClick={() => setStatusFn(s)}
                      disabled={pending}
                    />
                  ),
                )}
              </div>
              {progress?.mastered_at && status === "mastered" && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 inline-flex items-center gap-1">
                  <Sparkles className="size-3" strokeWidth={2} />
                  Savladano{" "}
                  {new Date(progress.mastered_at).toLocaleDateString("sr-Latn-RS", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })}
                </p>
              )}
            </div>
          )}

          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-2">
              Beleška
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Šta je važno za ovu temu kod ovog učenika…"
              rows={4}
              className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-sm outline-none focus:bg-secondary border border-border/60 focus:border-brand/40 resize-none"
            />
          </div>

          {!isSection ? (
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-2 inline-flex items-center gap-1.5">
              <CalendarDays className="size-3" strokeWidth={2} />
              Časovi sa ovom temom
              {!lessonsLoading && unitLessons.length > 0 && (
                <span className="text-muted-foreground/60 normal-case tracking-normal font-normal">
                  · {unitLessons.length}
                </span>
              )}
            </div>
            {lessonsLoading ? (
              <div className="text-xs text-muted-foreground italic">Učitavanje…</div>
            ) : unitLessons.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">
                Još nijedan čas nije tagovan ovom temom.
              </div>
            ) : (
              <ul className="space-y-1">
                {unitLessons.map((l) => {
                  const dt = new Date(l.scheduled_at);
                  return (
                    <li
                      key={l.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/30 text-xs"
                    >
                      <span className="tabular-nums text-muted-foreground w-20 shrink-0">
                        {dt.toLocaleDateString("sr-Latn-RS", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </span>
                      <span className="text-muted-foreground/70 tabular-nums">
                        {l.duration_minutes}min
                      </span>
                      {l.rating !== null && (
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                          <Star
                            className="size-3 fill-foreground/70 text-foreground/70"
                            strokeWidth={1.5}
                          />
                          {l.rating}
                        </span>
                      )}
                      {l.status !== "completed" && (
                        <span className="text-amber-500 dark:text-amber-400 text-[10px] uppercase tracking-wider">
                          {l.status === "scheduled" ? "Zakazan" : l.status}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          ) : null}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionPanelBody({
  sectionId,
  sectionTitle,
  children,
  progress,
  studentCurriculumId,
  studentId,
  onError,
}: {
  sectionId: string;
  sectionTitle: string;
  children: CurriculumUnit[];
  progress: StudentUnitProgress[];
  studentCurriculumId: string;
  studentId: string;
  onError: (msg: string | null) => void;
}) {
  const [pending, start] = useTransition();
  const statusByUnit = new Map(progress.map((p) => [p.unit_id, p.status]));
  const remaining = children.filter((c) => {
    const s = statusByUnit.get(c.id);
    return s !== "mastered" && s !== "skipped";
  });
  const allDone = remaining.length === 0;

  function markAll() {
    if (
      !confirm(
        `Označiti svih ${remaining.length} preostalih podtema u sekciji "${sectionTitle}" kao savladano?`,
      )
    )
      return;
    start(async () => {
      const res = await markSectionMasteredAction(
        studentCurriculumId,
        sectionId,
        studentId,
      );
      if (!res.ok) onError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-2">
          Sadržaj sekcije ({children.length})
        </div>
        <ul className="space-y-1">
          {children.map((c) => {
            const status = (statusByUnit.get(c.id) ?? "not_started") as UnitStatus;
            return (
              <li
                key={c.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/30 text-sm"
              >
                <StatusBubble status={status} />
                <span
                  className={cn(
                    "flex-1 min-w-0 truncate",
                    status === "mastered" && "text-muted-foreground",
                    status === "skipped" &&
                      "text-muted-foreground/60 line-through",
                  )}
                >
                  {c.title}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {allDone ? (
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
          <Sparkles className="size-3" strokeWidth={2} />
          Cela sekcija je završena.
        </div>
      ) : (
        <button
          type="button"
          onClick={markAll}
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
        >
          <Check className="size-4" strokeWidth={2.5} />
          Označi sve preostale kao savladano ({remaining.length})
        </button>
      )}
    </div>
  );
}

function StatusButton({
  s,
  active,
  onClick,
  disabled,
}: {
  s: UnitStatus;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const cls = {
    not_started: "border-border text-foreground",
    in_progress: "border-brand text-brand",
    mastered: "border-emerald-500/60 text-emerald-600 dark:text-emerald-400",
    skipped: "border-muted-foreground/40 text-muted-foreground",
  }[s];
  const activeCls = {
    not_started: "bg-secondary",
    in_progress: "bg-brand/10",
    mastered: "bg-emerald-500/10",
    skipped: "bg-secondary/80",
  }[s];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Označi kao ${UNIT_STATUS_LABELS[s]}`}
      className={cn(
        "h-10 rounded-lg border text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5",
        cls,
        active ? activeCls + " ring-2 ring-offset-2 ring-offset-card" : "hover:bg-secondary/40",
        active && s === "not_started" && "ring-foreground/20",
        active && s === "in_progress" && "ring-brand/40",
        active && s === "mastered" && "ring-emerald-500/40",
        active && s === "skipped" && "ring-muted-foreground/30",
        disabled && "opacity-60 cursor-wait",
      )}
    >
      {UNIT_STATUS_LABELS[s]}
    </button>
  );
}
