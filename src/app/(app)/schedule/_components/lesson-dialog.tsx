"use client";

import { useEffect, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
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
import {
  LESSON_STATUS_LABELS,
  LESSON_STATUS_OPTIONS,
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
  status: string;
};

type State =
  | { mode: "closed" }
  | { mode: "create"; defaultDate: string; defaultTime?: string }
  | { mode: "edit"; lesson: LessonWithStudent };

export function LessonDialog({
  state,
  students,
  onClose,
}: {
  state: State;
  students: StudentOption[];
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
      <DialogContent className="sm:max-w-md">
        {state.mode === "create" && (
          <CreateForm
            students={students}
            defaultDate={state.defaultDate}
            defaultTime={state.defaultTime}
            onDone={onClose}
          />
        )}
        {state.mode === "edit" && (
          <EditForm lesson={state.lesson} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  const [studentId, setStudentId] = useState<string>(
    students.find((s) => s.status === "active")?.id ?? students[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const selectedStudent = students.find((s) => s.id === studentId);

  function onSubmit(formData: FormData) {
    formData.set("student_id", studentId);
    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      const res = await createLesson(undefined, formData);
      if (res?.error) setError(res.error);
      else if (res?.fieldErrors) setFieldErrors(res.fieldErrors as Record<string, string>);
      else onDone();
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>Novi čas</DialogTitle>
        <DialogDescription>
          Izaberi učenika i termin. Cena se prepisuje iz profila učenika.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Učenik</Label>
          <Select
            value={studentId}
            onValueChange={(v) => setStudentId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Izaberi učenika">
                {(value: string) =>
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Datum"
            name="date"
            type="date"
            defaultValue={defaultDate}
            required
            error={fieldErrors.date}
          />
          <FormField
            label="Vreme"
            name="time"
            type="time"
            defaultValue={defaultTime ?? "16:00"}
            required
            error={fieldErrors.time}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Trajanje (min)"
            name="duration_minutes"
            type="number"
            defaultValue="60"
            inputMode="numeric"
            required
            error={fieldErrors.duration_minutes}
          />
          <FormField
            label="Cena (RSD)"
            name="price"
            type="text"
            inputMode="numeric"
            placeholder={
              selectedStudent && selectedStudent.default_price_per_lesson > 0
                ? String(parasToRsd(selectedStudent.default_price_per_lesson))
                : "1500"
            }
            error={fieldErrors.price}
            hint={
              selectedStudent && selectedStudent.default_price_per_lesson > 0
                ? "Default iz profila ako ne uneseš"
                : undefined
            }
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Otkaži
        </Button>
        <Button type="submit" size="sm" disabled={pending || !studentId}>
          {pending ? "Čuvanje..." : "Zakaži"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditForm({
  lesson,
  onDone,
}: {
  lesson: LessonWithStudent;
  onDone: () => void;
}) {
  const dt = parseISO(lesson.scheduled_at);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();

  // Allow user to clear errors when reopening
  useEffect(() => {
    setError(null);
    setFieldErrors({});
  }, [lesson.id]);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      const res = await updateLesson(lesson.id, undefined, formData);
      if (res?.error) setError(res.error);
      else if (res?.fieldErrors) setFieldErrors(res.fieldErrors as Record<string, string>);
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

  return (
    <form action={onSubmit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{lesson.students?.full_name ?? "Čas"}</DialogTitle>
        <DialogDescription>
          {format(dt, "d. MMMM yyyy., HH:mm")} ·{" "}
          {LESSON_STATUS_LABELS[lesson.status]}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Datum"
            name="date"
            type="date"
            defaultValue={format(dt, "yyyy-MM-dd")}
            required
            error={fieldErrors.date}
          />
          <FormField
            label="Vreme"
            name="time"
            type="time"
            defaultValue={format(dt, "HH:mm")}
            required
            error={fieldErrors.time}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Trajanje (min)"
            name="duration_minutes"
            type="number"
            defaultValue={String(lesson.duration_minutes)}
            inputMode="numeric"
            required
            error={fieldErrors.duration_minutes}
          />
          <FormField
            label="Cena (RSD)"
            name="price"
            type="text"
            inputMode="numeric"
            defaultValue={
              lesson.price ? String(parasToRsd(lesson.price)) : ""
            }
            error={fieldErrors.price}
          />
        </div>
      </div>

      {/* Status actions */}
      <div className="space-y-2">
        <Separator />
        <p className="text-xs text-muted-foreground">Obeleži status</p>
        <div className="grid grid-cols-2 gap-1.5">
          {LESSON_STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={lesson.status === opt.value ? "default" : "outline"}
              size="sm"
              disabled={statusPending}
              onClick={() => changeStatus(opt.value)}
              className="justify-start text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>
        {lesson.status !== "scheduled" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={statusPending}
            onClick={() => changeStatus("scheduled")}
            className="text-xs text-muted-foreground"
          >
            Vrati na "zakazan"
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <DialogFooter className="flex sm:flex-row sm:justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={statusPending}
          className={cn("text-destructive hover:text-destructive")}
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          Obriši
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Otkaži
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Čuvanje..." : "Sačuvaj"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

function FormField({
  label,
  name,
  type,
  defaultValue,
  placeholder,
  required,
  inputMode,
  error,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric";
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
