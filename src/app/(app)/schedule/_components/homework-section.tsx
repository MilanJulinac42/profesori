"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  MessageCircle,
  Check,
  Clock,
  Award,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createHomeworkAction,
  deleteHomeworkAction,
  updateHomeworkAction,
  listHomeworkForLessonAction,
} from "@/lib/homework/actions";
import {
  HOMEWORK_STATUS_LABELS,
  type Homework,
  type HomeworkStatus,
} from "@/lib/homework/types";
import { cn } from "@/lib/utils";

type Props = {
  studentId: string;
  studentName: string;
  parentPhone: string | null;
  lessonId: string;
  appBaseUrl: string;
};

export function HomeworkSection({
  studentId,
  studentName,
  parentPhone,
  lessonId,
  appBaseUrl,
}: Props) {
  const [items, setItems] = useState<Homework[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  // Pull stanja na mount.
  useEffect(() => {
    let cancel = false;
    listHomeworkForLessonAction(lessonId).then((rows) => {
      if (cancel) return;
      setItems(rows);
      setShowForm(rows.length === 0);
      setLoaded(true);
    });
    return () => {
      cancel = true;
    };
  }, [lessonId]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setError(null);
  }

  function handleCreate() {
    setError(null);
    if (!title.trim()) {
      setError("Naslov je obavezan.");
      return;
    }
    startTransition(async () => {
      const res = await createHomeworkAction({
        studentId,
        lessonId,
        title,
        description,
        dueDate: dueDate || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      reset();
      setShowForm(false);
      // Optimistic — server revalidate će pokupiti pravo stanje
      setItems((prev) => [
        {
          id: res.homeworkId,
          organization_id: "",
          student_id: studentId,
          lesson_id: lessonId,
          exercise_set_id: null,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          status: "assigned" as HomeworkStatus,
          submission_note: null,
          submitted_at: null,
          teacher_grade: null,
          teacher_feedback: null,
          graded_at: null,
          public_token: res.publicToken,
          submission_images: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        },
        ...prev,
      ]);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Obrisati domaći?")) return;
    startTransition(async () => {
      const res = await deleteHomeworkAction(id);
      if (res.ok) setItems((prev) => prev.filter((h) => h.id !== id));
    });
  }

  function handleStatusChange(id: string, status: HomeworkStatus) {
    startTransition(async () => {
      const res = await updateHomeworkAction({ homeworkId: id, status });
      if (res.ok) {
        setItems((prev) =>
          prev.map((h) => (h.id === id ? { ...h, status } : h)),
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">
          Domaći za sledeći put
          {!loaded && (
            <Loader2 className="size-3 animate-spin inline-block ml-1.5" strokeWidth={2} />
          )}
        </p>
        {loaded && !showForm && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            disabled={pending}
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            Dodaj
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="hw_title" className="text-xs">
              Naslov *
            </Label>
            <Input
              id="hw_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="npr. Strana 47, zadaci 3-7"
              className="h-8 text-sm"
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hw_desc" className="text-xs">
              Opis (opciono)
            </Label>
            <Textarea
              id="hw_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaljniji opis ili napomene..."
              className="text-sm min-h-[60px]"
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hw_due" className="text-xs">
              Rok (opciono)
            </Label>
            <Input
              id="hw_due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 text-sm"
              disabled={pending}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={pending || !title.trim()}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Check className="size-3.5" strokeWidth={2} />
              )}
              Sačuvaj
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                reset();
                setShowForm(false);
              }}
              disabled={pending}
            >
              Otkaži
            </Button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((hw) => (
            <HomeworkRow
              key={hw.id}
              hw={hw}
              studentName={studentName}
              parentPhone={parentPhone}
              appBaseUrl={appBaseUrl}
              onDelete={() => handleDelete(hw.id)}
              onStatusChange={(s) => handleStatusChange(hw.id, s)}
              pending={pending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function HomeworkRow({
  hw,
  studentName,
  parentPhone,
  appBaseUrl,
  onDelete,
  onStatusChange,
  pending,
}: {
  hw: Homework;
  studentName: string;
  parentPhone: string | null;
  appBaseUrl: string;
  onDelete: () => void;
  onStatusChange: (s: HomeworkStatus) => void;
  pending: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${appBaseUrl}/h/${hw.public_token}`;
  const dueLabel = hw.due_date
    ? new Date(hw.due_date).toLocaleDateString("sr-Latn-RS", {
        day: "numeric",
        month: "short",
      })
    : null;

  const shareText = [
    `Pozdrav! Marko${studentName === "Marko" ? "" : ` (${studentName})`} ima novi domaći:`,
    "",
    `📝 ${hw.title}`,
    hw.description ? `\n${hw.description}` : "",
    dueLabel ? `\n⏰ Rok: ${dueLabel}` : "",
    "",
    `Detalji i potvrda: ${url}`,
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n+/g, "\n");

  const whatsappUrl = parentPhone
    ? `https://wa.me/${parentPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <li className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{hw.title}</p>
          {hw.description && (
            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
              {hw.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <StatusBadge status={hw.status} />
            {dueLabel && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" strokeWidth={1.75} />
                {dueLabel}
              </span>
            )}
            {hw.teacher_grade !== null && (
              <span className="inline-flex items-center gap-1">
                <Award className="size-3" strokeWidth={1.75} />
                {hw.teacher_grade}/5
              </span>
            )}
          </div>
          {hw.submission_note && (
            <p className="text-xs text-muted-foreground mt-1.5 italic border-l-2 border-border pl-2">
              „{hw.submission_note}"
            </p>
          )}
          {hw.submission_images && hw.submission_images.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {hw.submission_images.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-md overflow-hidden border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`slika ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label="Obriši domaći"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copyLink}
          className="h-7 text-xs"
          disabled={pending}
        >
          {copied ? (
            <Check className="size-3" strokeWidth={2} />
          ) : (
            <Copy className="size-3" strokeWidth={1.75} />
          )}
          {copied ? "Kopirano" : "Kopiraj link"}
        </Button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background hover:bg-secondary text-xs h-7 px-2.5"
        >
          <MessageCircle className="size-3" strokeWidth={1.75} />
          WhatsApp
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background hover:bg-secondary text-xs h-7 px-2.5"
        >
          <ExternalLink className="size-3" strokeWidth={1.75} />
          Otvori
        </a>
        {hw.status === "submitted" && (
          <Button
            type="button"
            size="sm"
            onClick={() => onStatusChange("graded")}
            className="h-7 text-xs ml-auto"
            disabled={pending}
          >
            <Award className="size-3" strokeWidth={2} />
            Označi ocenjenim
          </Button>
        )}
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: HomeworkStatus }) {
  const tile =
    status === "submitted"
      ? "amber"
      : status === "graded"
        ? "emerald"
        : status === "skipped"
          ? "rose"
          : "cyan";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        `tile-${tile}`,
      )}
    >
      {HOMEWORK_STATUS_LABELS[status]}
    </span>
  );
}
