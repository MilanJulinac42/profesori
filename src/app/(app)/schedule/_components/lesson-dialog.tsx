"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import {
  Trash2,
  CalendarDays,
  Clock,
  Banknote,
  ExternalLink,
  Check,
  X,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TopicInput } from "@/components/topic-input";
import { StarRating } from "@/components/star-rating";
import {
  LESSON_STATUS_LABELS,
  type LessonStatus,
  type LessonWithStudent,
} from "@/lib/lessons/types";
import {
  createLesson,
  updateLesson,
  setLessonStatus,
  deleteLesson,
} from "@/lib/lessons/actions";
import { parasToRsd } from "@/lib/money";
import { cn } from "@/lib/utils";

type StudentOption = {
  id: string;
  full_name: string;
  default_price_per_lesson: number;
  default_lesson_duration_minutes: number;
  status: string;
};

type State =
  | { mode: "closed" }
  | { mode: "create"; defaultDate: string; defaultTime?: string }
  | { mode: "edit"; lesson: LessonWithStudent };

export type DialogStudents = StudentOption[];

const DURATION_PRESETS = [30, 45, 60, 90, 120];

export function LessonDialog({
  state,
  students,
  topicSuggestions,
  onClose,
}: {
  state: State;
  students: StudentOption[];
  topicSuggestions: string[];
  onClose: () => void;
}) {
  const open = state.mode !== "closed";
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg p-0 gap-0 max-h-[90vh] overflow-y-auto">
        {state.mode === "create" && (
          <CreateForm
            students={students}
            defaultDate={state.defaultDate}
            defaultTime={state.defaultTime}
            onDone={onClose}
          />
        )}
        {state.mode === "edit" && (
          <EditForm
            lesson={state.lesson}
            topicSuggestions={topicSuggestions}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- CREATE ---------------- */

function CreateForm({
  students,
  defaultDate,
  defaultTime,
  onDone,
}: {
  students: StudentOption[];
  defaultDate: string;
  defaultTime?: string;
  onDone: () => void;
}) {
  const initialStudent =
    students.find((s) => s.status === "active") ?? students[0];

  const [studentId, setStudentId] = useState<string>(initialStudent?.id ?? "");
  const [duration, setDuration] = useState<number>(
    initialStudent?.default_lesson_duration_minutes ?? 60,
  );
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime ?? "16:00");
  const [priceText, setPriceText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const selectedStudent = students.find((s) => s.id === studentId);

  // Auto-update duration when student changes if user hasn't manually set a non-default
  useEffect(() => {
    if (selectedStudent) {
      setDuration(selectedStudent.default_lesson_duration_minutes ?? 60);
    }
  }, [studentId, selectedStudent]);

  function onSubmit() {
    const fd = new FormData();
    fd.set("student_id", studentId);
    fd.set("date", date);
    fd.set("time", time);
    fd.set("duration_minutes", String(duration));
    if (priceText) fd.set("price", priceText);

    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      const res = await createLesson(undefined, fd);
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
          <DialogTitle>Zakaži čas</DialogTitle>
          <DialogDescription>
            Cena i trajanje se prepisuju iz profila učenika.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Student picker */}
        <div className="space-y-1.5">
          <Label className="text-xs">Učenik</Label>
          <Select
            value={studentId}
            onValueChange={(v) => setStudentId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Izaberi učenika">
                {(value: string | null) =>
                  students.find((s) => s.id === value)?.full_name ??
                  "Izaberi učenika"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStudent && (
            <p className="text-[11px] text-muted-foreground">
              Default: {selectedStudent.default_lesson_duration_minutes} min
              {selectedStudent.default_price_per_lesson > 0 &&
                ` · ${parasToRsd(selectedStudent.default_price_per_lesson)} RSD/čas`}
            </p>
          )}
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs">
              <CalendarDays
                className="size-3 inline -mt-0.5 mr-1"
                strokeWidth={1.75}
              />
              Datum
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              aria-invalid={!!fieldErrors.date}
            />
            {fieldErrors.date && (
              <p className="text-xs text-destructive">{fieldErrors.date}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time" className="text-xs">
              <Clock
                className="size-3 inline -mt-0.5 mr-1"
                strokeWidth={1.75}
              />
              Vreme
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              aria-invalid={!!fieldErrors.time}
            />
          </div>
        </div>

        {/* Duration chips */}
        <div className="space-y-1.5">
          <Label className="text-xs">Trajanje</Label>
          <div className="flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors tabular-nums",
                  duration === d
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:bg-secondary",
                )}
              >
                {d} min
              </button>
            ))}
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 0)}
              min={1}
              max={480}
              className="w-16 h-7 text-xs px-2"
              aria-label="Custom trajanje u minutima"
            />
          </div>
          {fieldErrors.duration_minutes && (
            <p className="text-xs text-destructive">
              {fieldErrors.duration_minutes}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <Label htmlFor="price" className="text-xs">
            <Banknote
              className="size-3 inline -mt-0.5 mr-1"
              strokeWidth={1.75}
            />
            Cena (RSD)
          </Label>
          <Input
            id="price"
            type="text"
            inputMode="numeric"
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            placeholder={
              selectedStudent && selectedStudent.default_price_per_lesson > 0
                ? String(parasToRsd(selectedStudent.default_price_per_lesson))
                : "1500"
            }
            aria-invalid={!!fieldErrors.price}
          />
          {fieldErrors.price && (
            <p className="text-xs text-destructive">{fieldErrors.price}</p>
          )}
          {!fieldErrors.price &&
            selectedStudent &&
            selectedStudent.default_price_per_lesson > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Default iz profila ako ostaviš prazno.
              </p>
            )}
        </div>

        {/* Conflict / generic error */}
        {fieldErrors.time && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {fieldErrors.time}
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
        <Button
          type="button"
          size="sm"
          disabled={pending || !studentId}
          onClick={onSubmit}
        >
          {pending ? "Čuvanje..." : "Zakaži"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ---------------- EDIT ---------------- */

function EditForm({
  lesson,
  topicSuggestions,
  onDone,
}: {
  lesson: LessonWithStudent;
  topicSuggestions: string[];
  onDone: () => void;
}) {
  const dt = parseISO(lesson.scheduled_at);
  const [date, setDate] = useState(format(dt, "yyyy-MM-dd"));
  const [time, setTime] = useState(format(dt, "HH:mm"));
  const [duration, setDuration] = useState(lesson.duration_minutes);
  const [priceText, setPriceText] = useState(
    lesson.price ? String(parasToRsd(lesson.price)) : "",
  );
  // Notes state
  const [notesAfter, setNotesAfter] = useState(lesson.notes_after_lesson ?? "");
  const [topics, setTopics] = useState<string[]>(lesson.topics_covered ?? []);
  const [rating, setRating] = useState<number | null>(lesson.lesson_rating);
  const [nextPlan, setNextPlan] = useState(lesson.next_lesson_plan ?? "");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();

  useEffect(() => {
    setError(null);
    setFieldErrors({});
  }, [lesson.id]);

  function onSubmit() {
    const fd = new FormData();
    fd.set("date", date);
    fd.set("time", time);
    fd.set("duration_minutes", String(duration));
    if (priceText) fd.set("price", priceText);
    fd.set("notes_after_lesson", notesAfter);
    fd.set("next_lesson_plan", nextPlan);
    fd.set("topics_covered", JSON.stringify(topics));
    if (rating !== null) fd.set("lesson_rating", String(rating));

    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      const res = await updateLesson(lesson.id, undefined, fd);
      if (res?.error) setError(res.error);
      else if (res?.fieldErrors)
        setFieldErrors(res.fieldErrors as Record<string, string>);
      else onDone();
    });
  }

  function changeStatus(status: LessonStatus) {
    startStatusTransition(async () => {
      try {
        await setLessonStatus(lesson.id, status);
        onDone();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function onDelete() {
    if (!confirm("Obrisati ovaj čas?")) return;
    startStatusTransition(async () => {
      try {
        await deleteLesson(lesson.id);
        onDone();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  const dtLabel = format(dt, "EEEE, d. MMMM", { locale: sr });

  return (
    <div>
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lesson.students?.full_name ?? "Čas"}
            {lesson.students?.id && (
              <Link
                href={`/students/${lesson.students.id}`}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Otvori profil učenika"
              >
                <ExternalLink className="size-3.5" strokeWidth={1.75} />
              </Link>
            )}
          </DialogTitle>
          <DialogDescription>
            {dtLabel} ·{" "}
            <span
              className={cn(
                lesson.status !== "scheduled" && "font-medium",
                lesson.status === "completed" && "text-foreground",
                lesson.status === "no_show" && "text-destructive",
              )}
            >
              {LESSON_STATUS_LABELS[lesson.status]}
            </span>
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="px-5 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date-edit" className="text-xs">
              Datum
            </Label>
            <Input
              id="date-edit"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              aria-invalid={!!fieldErrors.date}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time-edit" className="text-xs">
              Vreme
            </Label>
            <Input
              id="time-edit"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              aria-invalid={!!fieldErrors.time}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Trajanje</Label>
          <div className="flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors tabular-nums",
                  duration === d
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:bg-secondary",
                )}
              >
                {d} min
              </button>
            ))}
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 0)}
              min={1}
              max={480}
              className="w-16 h-7 text-xs px-2"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price-edit" className="text-xs">
            Cena (RSD)
          </Label>
          <Input
            id="price-edit"
            type="text"
            inputMode="numeric"
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            aria-invalid={!!fieldErrors.price}
          />
          {fieldErrors.price && (
            <p className="text-xs text-destructive">{fieldErrors.price}</p>
          )}
        </div>

        {fieldErrors.time && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {fieldErrors.time}
          </div>
        )}

        {/* Notes section */}
        <div className="space-y-3">
          <Separator />
          <div className="pt-1">
            <p className="text-xs font-medium">Beleške posle časa</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Privatno za tebe — učenik ne vidi.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes_after_lesson" className="text-xs">
              Šta je rađeno
            </Label>
            <Textarea
              id="notes_after_lesson"
              value={notesAfter}
              onChange={(e) => setNotesAfter(e.target.value)}
              rows={3}
              placeholder="Kratko: o čemu ste pričali, šta ste vežbali..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Teme</Label>
            <TopicInput
              value={topics}
              onChange={setTopics}
              suggestions={topicSuggestions}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Kako je išlo</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next_lesson_plan" className="text-xs">
              Šta za sledeći put
            </Label>
            <Textarea
              id="next_lesson_plan"
              value={nextPlan}
              onChange={(e) => setNextPlan(e.target.value)}
              rows={2}
              placeholder="Plan za sledeći čas..."
            />
          </div>
        </div>

        {/* Status row */}
        <div>
          <Separator />
          <div className="pt-4 space-y-2">
            <p className="text-xs text-muted-foreground">Obeleži status</p>
            <div className="grid grid-cols-2 gap-1.5">
              <StatusButton
                active={lesson.status === "completed"}
                onClick={() => changeStatus("completed")}
                disabled={statusPending}
                icon={Check}
                label="Održan"
              />
              <StatusButton
                active={lesson.status === "cancelled_by_student"}
                onClick={() => changeStatus("cancelled_by_student")}
                disabled={statusPending}
                icon={X}
                label="Otkazao učenik"
              />
              <StatusButton
                active={lesson.status === "cancelled_by_teacher"}
                onClick={() => changeStatus("cancelled_by_teacher")}
                disabled={statusPending}
                icon={X}
                label="Otkazao profesor"
              />
              <StatusButton
                active={lesson.status === "no_show"}
                onClick={() => changeStatus("no_show")}
                disabled={statusPending}
                icon={XCircle}
                label="Nije se pojavio"
                tone="danger"
              />
            </div>
            {lesson.status !== "scheduled" && (
              <button
                type="button"
                onClick={() => changeStatus("scheduled")}
                disabled={statusPending}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
              >
                <HelpCircle className="size-3" strokeWidth={1.75} />
                Vrati na zakazan
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <DialogFooter className="!mx-0 !mb-0 flex flex-row !justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={statusPending}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          Obriši
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Otkaži
          </Button>
          <Button type="button" size="sm" disabled={pending} onClick={onSubmit}>
            {pending ? "Čuvanje..." : "Sačuvaj"}
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}

function StatusButton({
  active,
  onClick,
  disabled,
  icon: Icon,
  label,
  tone = "default",
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: typeof Check;
  label: string;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors text-left",
        active
          ? tone === "danger"
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:bg-secondary",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </button>
  );
}
