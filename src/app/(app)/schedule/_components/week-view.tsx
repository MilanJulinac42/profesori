"use client";

import { useState, useMemo } from "react";
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
  status: string;
};

type DialogState =
  | { mode: "closed" }
  | { mode: "create"; defaultDate: string; defaultTime?: string }
  | { mode: "edit"; lesson: LessonWithStudent };

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

  // Group lessons by day index.
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

  return (
    <>
      <div className="px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
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
                setDialog({
                  mode: "create",
                  defaultDate: format(target, "yyyy-MM-dd"),
                });
              }}
              disabled={students.length === 0}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToWeek(new Date())}
          >
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

        {students.length === 0 && (
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

        {/* Week grid */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 sm:gap-1.5">
            {days.map((day, idx) => (
              <DayColumn
                key={day.toISOString()}
                day={day}
                lessons={byDay[idx] ?? []}
                onAddClick={() =>
                  setDialog({
                    mode: "create",
                    defaultDate: format(day, "yyyy-MM-dd"),
                  })
                }
                onLessonClick={(lesson) =>
                  setDialog({ mode: "edit", lesson })
                }
              />
            ))}
          </div>
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

function DayColumn({
  day,
  lessons,
  onAddClick,
  onLessonClick,
}: {
  day: Date;
  lessons: LessonWithStudent[];
  onAddClick: () => void;
  onLessonClick: (lesson: LessonWithStudent) => void;
}) {
  const today = isToday(day);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card flex flex-col min-h-[200px]",
        today && "border-foreground/40",
      )}
    >
      <div className="px-3 py-2 border-b border-border flex items-baseline justify-between">
        <div>
          <p
            className={cn(
              "text-[11px] uppercase tracking-wider",
              today ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {format(day, "EEE", { locale: sr })}
          </p>
          <p
            className={cn(
              "text-lg font-medium tabular-nums leading-tight",
              today && "text-foreground",
            )}
          >
            {format(day, "d.")}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="size-6 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dodaj čas"
        >
          <Plus className="size-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex-1 p-2 space-y-1.5">
        {lessons.length === 0 ? (
          <button
            type="button"
            onClick={onAddClick}
            className="w-full text-left text-xs text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 rounded px-2 py-1.5 transition-colors"
          >
            Nema časova
          </button>
        ) : (
          lessons.map((l) => (
            <LessonCard
              key={l.id}
              lesson={l}
              onClick={() => onLessonClick(l)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  onClick,
}: {
  lesson: LessonWithStudent;
  onClick: () => void;
}) {
  const time = format(parseISO(lesson.scheduled_at), "HH:mm");
  const tone = STATUS_TONE[lesson.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border p-2 transition-colors",
        tone.border,
        tone.bg,
        tone.hover,
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-xs font-medium tabular-nums">{time}</span>
        <span className="text-[10px] text-muted-foreground">
          {lesson.duration_minutes}′
        </span>
      </div>
      <p className={cn("text-sm font-medium truncate mt-0.5", tone.text)}>
        {lesson.students?.full_name ?? "Nepoznat učenik"}
      </p>
      {lesson.status !== "scheduled" && (
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {LESSON_STATUS_LABELS[lesson.status]}
        </p>
      )}
      {lesson.price > 0 && lesson.status === "scheduled" && (
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatRsd(lesson.price)}
        </p>
      )}
    </button>
  );
}

const STATUS_TONE: Record<
  LessonStatus,
  { border: string; bg: string; hover: string; text: string }
> = {
  scheduled: {
    border: "border-border",
    bg: "bg-secondary/40",
    hover: "hover:bg-secondary",
    text: "text-foreground",
  },
  completed: {
    border: "border-border",
    bg: "bg-card",
    hover: "hover:bg-secondary/40",
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
    border: "border-destructive/30",
    bg: "bg-destructive/5",
    hover: "hover:bg-destructive/10",
    text: "text-destructive",
  },
};
