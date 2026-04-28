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
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { formatRsd } from "@/lib/money";
import {
  LESSON_STATUS_LABELS,
  type LessonWithStudent,
  type LessonStatus,
} from "@/lib/lessons/types";
import { LessonDialog } from "./lesson-dialog";

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
}: {
  weekStartISO: string;
  lessons: LessonWithStudent[];
  students: StudentOption[];
}) {
  const router = useRouter();
  const weekStart = parseISO(weekStartISO);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
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
      <div className="px-4 sm:px-8 py-6 space-y-5 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Raspored"
          description={`${monthLabel} · ${rangeLabel}`}
          actions={
            <Button
              size="sm"
              onClick={() => {
                const today = new Date();
                const target = days.some((d) => isSameDay(d, today))
                  ? today
                  : days[0];
                openCreate(target);
              }}
              disabled={noStudents}
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Novi čas
            </Button>
          }
        />

        {/* Week navigator */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goToWeek(addDays(weekStart, -7))}
            aria-label="Prethodna nedelja"
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToWeek(new Date())}>
            Danas
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goToWeek(addDays(weekStart, 7))}
            aria-label="Sledeća nedelja"
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </Button>
        </div>

        {noStudents && (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <CalendarDays
              className="size-5 text-muted-foreground mx-auto"
              strokeWidth={1.75}
            />
            <p className="text-sm font-medium mt-3">
              Dodaj prvo učenika da bi mogao da zakazuješ časove.
            </p>
            <Link
              href="/students/new"
              className={buttonVariants({ size: "sm" }) + " mt-4"}
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Dodaj učenika
            </Link>
          </div>
        )}

        {!noStudents && (
          <>
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
                      "flex flex-col items-center justify-center shrink-0 rounded-lg border px-3 py-2 min-w-[60px] transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:bg-secondary",
                    )}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-70">
                      {format(day, "EEE", { locale: sr })}
                    </span>
                    <span className="text-lg font-medium tabular-nums leading-tight">
                      {format(day, "d")}
                    </span>
                    {todayMark && !active && (
                      <span className="size-1 rounded-full bg-foreground mt-0.5" />
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
          </>
        )}
      </div>

      <LessonDialog
        state={dialog}
        students={students}
        onClose={() => setDialog({ mode: "closed" })}
      />
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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex">
        {/* Hour gutter */}
        <div className="w-14 shrink-0 border-r border-border">
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
          "border-b border-border flex items-center justify-center gap-2 sticky top-0 bg-card z-10",
          today && "bg-secondary/50",
        )}
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] uppercase tracking-wider",
              today ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {format(day, "EEE", { locale: sr })}
          </span>
          <span
            className={cn(
              "text-base font-medium tabular-nums",
              today &&
                "size-7 rounded-full bg-foreground text-background inline-flex items-center justify-center",
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
        <div className="absolute -left-1 -top-1 size-2 rounded-full bg-destructive" />
        <div className="h-px bg-destructive" />
      </div>
    </div>
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
    border: "border-foreground/15",
    bg: "bg-foreground text-background dark:bg-foreground/90",
    hover: "hover:bg-foreground/90",
    text: "text-background",
  },
  completed: {
    border: "border-border",
    bg: "bg-secondary/70",
    hover: "hover:bg-secondary",
    text: "text-muted-foreground line-through",
  },
  cancelled_by_teacher: {
    border: "border-dashed border-border",
    bg: "bg-card",
    hover: "hover:bg-secondary/40",
    text: "text-muted-foreground line-through",
  },
  cancelled_by_student: {
    border: "border-dashed border-border",
    bg: "bg-card",
    hover: "hover:bg-secondary/40",
    text: "text-muted-foreground line-through",
  },
  no_show: {
    border: "border-destructive/40",
    bg: "bg-destructive/10",
    hover: "hover:bg-destructive/15",
    text: "text-destructive",
  },
};
