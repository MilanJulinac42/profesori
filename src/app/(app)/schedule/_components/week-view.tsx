"use client";

import { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  format,
  parseISO,
  isToday,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { sr } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { formatRsd } from "@/lib/money";
import {
  LESSON_STATUS_LABELS,
  type LessonWithStudent,
  type LessonStatus,
} from "@/lib/lessons/types";
import dynamic from "next/dynamic";

const LessonDialog = dynamic(
  () => import("./lesson-dialog").then((m) => m.LessonDialog),
  { ssr: false },
);

const BulkActionsDialog = dynamic(
  () =>
    import("./bulk-actions-dialog").then((m) => m.BulkActionsDialog),
  { ssr: false },
);

type StudentOption = {
  id: string;
  full_name: string;
  default_price_per_lesson: number;
  default_lesson_duration_minutes: number;
  status: string;
};

type DialogState =
  | { mode: "closed" }
  | { mode: "create"; defaultDate: string; defaultTime?: string }
  | { mode: "edit"; lesson: LessonWithStudent };

const START_HOUR = 7;
const END_HOUR = 22; // exclusive (last row label is 21:00)
const HOUR_HEIGHT = 56;
const HEADER_HEIGHT = 56;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export function WeekView({
  weekStartISO,
  lessons,
  students,
  topicSuggestions,
}: {
  weekStartISO: string;
  lessons: LessonWithStudent[];
  students: StudentOption[];
  topicSuggestions: string[];
}) {
  const router = useRouter();
  const weekStart = parseISO(weekStartISO);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [mobileDay, setMobileDay] = useState<Date>(() => {
    const todayInWeek = days.find((d) => isToday(d));
    return todayInWeek ?? days[0];
  });

  const byDay = useMemo(() => {
    const map: Record<number, LessonWithStudent[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    for (const lesson of lessons) {
      const idx = days.findIndex((d) =>
        isSameDay(d, parseISO(lesson.scheduled_at)),
      );
      if (idx >= 0) map[idx].push(lesson);
    }
    return map;
  }, [lessons, days]);

  const goToWeek = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    router.push(`/schedule?week=${format(start, "yyyy-MM-dd")}`);
  };

  const monthLabel = format(weekStart, "LLLL yyyy", { locale: sr });
  const rangeLabel = `${format(days[0], "d.")} – ${format(days[6], "d. MMM", { locale: sr })}`;

  const openCreate = (date: Date, hour?: number) => {
    setDialog({
      mode: "create",
      defaultDate: format(date, "yyyy-MM-dd"),
      defaultTime: hour !== undefined ? `${String(hour).padStart(2, "0")}:00` : undefined,
    });
  };

  const noStudents = students.length === 0;

  return (
    <>
      <div className="px-4 sm:px-8 py-6 space-y-5 max-w-[1400px] mx-auto w-full">
        <PageHeader
          title="Raspored"
          description={`${monthLabel} · ${rangeLabel}`}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                title="Grupne akcije nad zakazanim časovima"
              >
                <Wand2 className="size-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Grupne akcije</span>
              </button>
              <button
                type="button"
                data-tour="schedule-create"
                onClick={() => {
                  const today = new Date();
                  const target = days.some((d) => isSameDay(d, today))
                    ? today
                    : days[0];
                  openCreate(target);
                }}
                disabled={noStudents}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Plus className="size-3.5" strokeWidth={2.25} />
                Novi čas
              </button>
            </div>
          }
        />

        {/* Week navigator + summary */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => goToWeek(addDays(weekStart, -7))}
              aria-label="Prethodna nedelja"
              className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => goToWeek(new Date())}
              className="inline-flex items-center justify-center h-8 px-3 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Danas
            </button>
            <button
              type="button"
              onClick={() => goToWeek(addDays(weekStart, 7))}
              aria-label="Sledeća nedelja"
              className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
          </div>

          {!noStudents && lessons.length > 0 && (
            <WeekSummary lessons={lessons} />
          )}
        </div>

        {noStudents && (
          <EmptyState
            icon={CalendarDays}
            tile="cyan"
            title="Dodaj prvo učenika"
            description="Da bi mogao da zakazuješ časove, prvo treba da dodaš makar jednog učenika u sistem."
            action={
              <Link
                href="/students/new"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
              >
                <Plus className="size-3.5" strokeWidth={2.25} />
                Dodaj učenika
              </Link>
            }
          />
        )}

        {!noStudents && (
          <div data-tour="schedule-week">
            {/* Mobile day picker */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
              {days.map((day) => {
                const active = isSameDay(day, mobileDay);
                const todayMark = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setMobileDay(day)}
                    className={cn(
                      "flex flex-col items-center justify-center shrink-0 rounded-xl border px-3 py-2 min-w-[60px] transition-all",
                      active
                        ? "border-brand bg-brand text-brand-foreground shadow-[0_4px_12px_-4px_oklch(0.78_0.16_205/0.5)]"
                        : "border-border bg-card hover:bg-secondary/60",
                    )}
                  >
                    <span className="text-[10px] uppercase tracking-[0.14em] font-semibold opacity-80">
                      {format(day, "EEE", { locale: sr })}
                    </span>
                    <span className="text-lg font-semibold tabular-nums leading-tight">
                      {format(day, "d")}
                    </span>
                    {todayMark && !active && (
                      <span className="size-1.5 rounded-full bg-brand mt-0.5 pulse-dot" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile single-day grid */}
            <div className="md:hidden">
              <TimeGrid
                days={[mobileDay]}
                lessonsByDay={[
                  byDay[days.findIndex((d) => isSameDay(d, mobileDay))] ?? [],
                ]}
                onSlotClick={(d, h) => openCreate(d, h)}
                onLessonClick={(l) => setDialog({ mode: "edit", lesson: l })}
              />
            </div>

            {/* Desktop 7-day grid */}
            <div className="hidden md:block">
              <TimeGrid
                days={days}
                lessonsByDay={days.map((_, idx) => byDay[idx] ?? [])}
                onSlotClick={(d, h) => openCreate(d, h)}
                onLessonClick={(l) => setDialog({ mode: "edit", lesson: l })}
              />
            </div>
          </div>
        )}
      </div>

      {dialog.mode !== "closed" && (
        <LessonDialog
          state={dialog}
          students={students}
          topicSuggestions={topicSuggestions}
          onClose={() => setDialog({ mode: "closed" })}
        />
      )}
      {bulkOpen && (
        <BulkActionsDialog
          initialMode="cancel"
          onClose={() => setBulkOpen(false)}
        />
      )}
    </>
  );
}

/* ---------- TimeGrid ---------- */

function TimeGrid({
  days,
  lessonsByDay,
  onSlotClick,
  onLessonClick,
}: {
  days: Date[];
  lessonsByDay: LessonWithStudent[][];
  onSlotClick: (day: Date, hour: number) => void;
  onLessonClick: (lesson: LessonWithStudent) => void;
}) {
  return (
    <div className="card-elevated card-glow rounded-2xl overflow-hidden">
      <div className="flex">
        {/* Hour gutter */}
        <div className="w-14 shrink-0 border-r border-border bg-secondary/30">
          {/* Corner spacer */}
          <div className="border-b border-border" style={{ height: HEADER_HEIGHT }} />
          {HOURS.map((h) => (
            <div
              key={h}
              className="relative text-[11px] text-muted-foreground tabular-nums"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="absolute -top-2 right-2">{h}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div
          className="flex-1 grid"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((day, idx) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              lessons={lessonsByDay[idx] ?? []}
              onSlotClick={(h) => onSlotClick(day, h)}
              onLessonClick={onLessonClick}
              isLast={idx === days.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  day,
  lessons,
  onSlotClick,
  onLessonClick,
  isLast,
}: {
  day: Date;
  lessons: LessonWithStudent[];
  onSlotClick: (hour: number) => void;
  onLessonClick: (lesson: LessonWithStudent) => void;
  isLast: boolean;
}) {
  const today = isToday(day);

  return (
    <div className={cn("relative", !isLast && "border-r border-border")}>
      {/* Day header */}
      <div
        className={cn(
          "border-b border-border flex items-center justify-center gap-2 sticky top-0 bg-card z-10 transition-colors",
          today && "bg-brand-soft dark:bg-[oklch(0.78_0.16_205/0.08)]",
        )}
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.16em] font-semibold",
              today ? "text-brand" : "text-muted-foreground",
            )}
          >
            {format(day, "EEE", { locale: sr })}
          </span>
          <span
            className={cn(
              "text-base font-semibold tabular-nums",
              today &&
                "size-7 rounded-full bg-brand text-brand-foreground inline-flex items-center justify-center shadow-[0_2px_8px_-2px_oklch(0.78_0.16_205/0.5)]",
            )}
          >
            {format(day, "d")}
          </span>
        </div>
      </div>

      {/* Hour cells (clickable backgrounds) */}
      <div className="relative">
        {HOURS.map((h, i) => (
          <button
            type="button"
            key={h}
            onClick={() => onSlotClick(h)}
            aria-label={`Dodaj čas ${format(day, "EEEE")} u ${h}:00`}
            className={cn(
              "block w-full transition-colors hover:bg-secondary/40 focus:bg-secondary/60 outline-none",
              i !== 0 && "border-t border-border",
              i === 0 && "border-t border-transparent",
            )}
            style={{ height: HOUR_HEIGHT }}
          />
        ))}

        {/* Now indicator */}
        {today && <NowIndicator />}

        {/* Lessons */}
        {lessons.map((l) => (
          <LessonBlock key={l.id} lesson={l} onClick={() => onLessonClick(l)} />
        ))}
      </div>
    </div>
  );
}

function NowIndicator() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour < START_HOUR || hour >= END_HOUR) return null;
  const top = (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top }}
    >
      <div className="relative">
        <div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-brand pulse-dot" />
        <div className="h-[1.5px] bg-brand shadow-[0_0_8px_-1px_oklch(0.78_0.16_205/0.6)]" />
      </div>
    </div>
  );
}

function WeekSummary({ lessons }: { lessons: LessonWithStudent[] }) {
  const scheduled = lessons.filter((l) => l.status === "scheduled").length;
  const completed = lessons.filter((l) => l.status === "completed").length;
  const cancelled = lessons.filter(
    (l) =>
      l.status === "cancelled_by_teacher" ||
      l.status === "cancelled_by_student" ||
      l.status === "no_show",
  ).length;
  const revenue = lessons
    .filter((l) => l.status === "completed")
    .reduce((sum, l) => sum + l.price, 0);

  return (
    <div className="flex items-center gap-4 text-xs flex-wrap">
      <SummaryItem
        dotClass="bg-brand"
        label="zakazano"
        value={String(scheduled)}
      />
      <SummaryItem
        dotClass="bg-emerald-500 dark:bg-emerald-400"
        label="održano"
        value={String(completed)}
      />
      {cancelled > 0 && (
        <SummaryItem
          dotClass="bg-rose-500 dark:bg-rose-400"
          label="otkazano"
          value={String(cancelled)}
        />
      )}
      {revenue > 0 && (
        <span className="text-muted-foreground tabular-nums">
          ·{" "}
          <span className="font-semibold text-foreground">
            {formatRsd(revenue)}
          </span>
        </span>
      )}
    </div>
  );
}

function SummaryItem({
  dotClass,
  label,
  value,
}: {
  dotClass: string;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-muted-foreground/80">{label}</span>
    </span>
  );
}

function LessonBlock({
  lesson,
  onClick,
}: {
  lesson: LessonWithStudent;
  onClick: () => void;
}) {
  const dt = parseISO(lesson.scheduled_at);
  const hour = dt.getHours();
  const minute = dt.getMinutes();
  const top = (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
  const height = Math.max(28, (lesson.duration_minutes / 60) * HOUR_HEIGHT);

  if (hour < START_HOUR || hour >= END_HOUR) return null;

  const tone = STATUS_TONE[lesson.status];
  const time = format(dt, "HH:mm");
  const tight = height < 56;
  const missingNotes =
    lesson.status === "completed" &&
    !lesson.notes_after_lesson &&
    (!lesson.topics_covered || lesson.topics_covered.length === 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-md border text-left px-2 py-1 transition-colors overflow-hidden",
        tone.border,
        tone.bg,
        tone.hover,
        "z-10 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
      )}
      style={{ top: top + 1, height: height - 2 }}
    >
      {missingNotes && (
        <span
          className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-amber-500"
          aria-label="Nema beleški"
        />
      )}
      {tight ? (
        <div className="flex items-baseline gap-1.5">
          <span className={cn("text-[11px] font-medium tabular-nums", tone.text)}>
            {time}
          </span>
          <span
            className={cn("text-[11px] truncate", tone.text)}
          >
            {lesson.students?.full_name ?? "?"}
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-[11px] font-medium tabular-nums", tone.text)}>
              {time}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {lesson.duration_minutes}′
            </span>
          </div>
          <div className={cn("text-xs font-medium truncate mt-0.5", tone.text)}>
            {lesson.students?.full_name ?? "Nepoznat učenik"}
          </div>
          {height >= 84 && lesson.status !== "scheduled" && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {LESSON_STATUS_LABELS[lesson.status]}
            </div>
          )}
          {height >= 84 && lesson.status === "scheduled" && lesson.price > 0 && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {formatRsd(lesson.price)}
            </div>
          )}
        </>
      )}
    </button>
  );
}

const STATUS_TONE: Record<
  LessonStatus,
  { border: string; bg: string; hover: string; text: string }
> = {
  scheduled: {
    border: "border-[oklch(0.78_0.16_205/0.4)] dark:border-[oklch(0.78_0.16_205/0.4)]",
    bg: "bg-[oklch(0.78_0.16_205)] dark:bg-[oklch(0.4_0.16_205/0.5)]",
    hover:
      "hover:bg-[oklch(0.72_0.18_205)] dark:hover:bg-[oklch(0.45_0.18_205/0.6)]",
    text: "text-white dark:text-[oklch(0.92_0.08_205)]",
  },
  completed: {
    border:
      "border-[oklch(0.74_0.2_150/0.35)] dark:border-[oklch(0.74_0.2_150/0.35)]",
    bg: "bg-[oklch(0.92_0.08_150)] dark:bg-[oklch(0.35_0.14_150/0.4)]",
    hover:
      "hover:bg-[oklch(0.88_0.1_150)] dark:hover:bg-[oklch(0.4_0.16_150/0.5)]",
    text: "text-[oklch(0.35_0.14_150)] dark:text-[oklch(0.85_0.13_150)]",
  },
  cancelled_by_teacher: {
    border: "border-dashed border-border",
    bg: "bg-secondary/40",
    hover: "hover:bg-secondary/70",
    text: "text-muted-foreground line-through",
  },
  cancelled_by_student: {
    border: "border-dashed border-border",
    bg: "bg-secondary/40",
    hover: "hover:bg-secondary/70",
    text: "text-muted-foreground line-through",
  },
  no_show: {
    border:
      "border-[oklch(0.65_0.25_25/0.4)] dark:border-[oklch(0.65_0.25_25/0.4)]",
    bg: "bg-[oklch(0.94_0.08_15)] dark:bg-[oklch(0.35_0.18_15/0.4)]",
    hover:
      "hover:bg-[oklch(0.9_0.1_15)] dark:hover:bg-[oklch(0.4_0.2_15/0.5)]",
    text: "text-[oklch(0.45_0.2_15)] dark:text-[oklch(0.85_0.16_15)]",
  },
};
