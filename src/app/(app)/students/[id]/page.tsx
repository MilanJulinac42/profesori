import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  School,
  GraduationCap,
  Banknote,
  CalendarDays,
  StickyNote,
  Archive,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatRsd } from "@/lib/money";
import {
  EDUCATION_LABELS,
  STATUS_LABELS,
  type EducationLevel,
  type Student,
} from "@/lib/students/types";
import { archiveStudent } from "@/lib/students/actions";
import {
  LESSON_STATUS_LABELS,
  type Lesson,
  type LessonStatus,
} from "@/lib/lessons/types";

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) notFound();
  const s = data as Student;

  // Lessons for this student.
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select("*")
    .eq("student_id", s.id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false });
  const lessons = (lessonsData as Lesson[] | null) ?? [];

  const upcomingLessons = lessons.filter(
    (l) => l.status === "scheduled" && new Date(l.scheduled_at) >= new Date(),
  );
  const pastLessons = lessons.filter(
    (l) => !(l.status === "scheduled" && new Date(l.scheduled_at) >= new Date()),
  );

  const totalLessonsHeld = lessons.filter(
    (l) => l.status === "completed",
  ).length;
  const nextLesson = upcomingLessons[upcomingLessons.length - 1];

  return (
    <div className="px-4 sm:px-8 py-6 space-y-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Nazad na učenike
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight">{s.full_name}</h1>
            <Badge variant={s.status === "active" ? "default" : "secondary"} className="font-normal">
              {STATUS_LABELS[s.status]}
            </Badge>
          </div>
          {s.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${s.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
            Izmeni
          </Link>
          <form action={archiveStudent.bind(null, s.id)}>
            <button
              type="submit"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <Archive className="size-3.5" strokeWidth={1.75} />
              Arhiviraj
            </button>
          </form>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Dug" value="0 RSD" icon={Banknote} hint="—" />
        <Stat
          label="Časova održano"
          value={String(totalLessonsHeld)}
          icon={CalendarDays}
          hint={`${lessons.length} ukupno`}
        />
        <Stat
          label="Sledeći čas"
          value={
            nextLesson
              ? new Date(nextLesson.scheduled_at).toLocaleDateString(
                  "sr-Latn-RS",
                  { day: "numeric", month: "short" },
                )
              : "—"
          }
          icon={CalendarDays}
          hint={
            nextLesson
              ? new Date(nextLesson.scheduled_at).toLocaleTimeString(
                  "sr-Latn-RS",
                  { hour: "2-digit", minute: "2-digit" },
                )
              : "Nije zakazan"
          }
        />
        <Stat
          label="Cena po času"
          value={
            s.default_price_per_lesson > 0
              ? formatRsd(s.default_price_per_lesson)
              : "—"
          }
          icon={Banknote}
          hint={`${s.default_lesson_duration_minutes} min default`}
        />
      </div>

      {/* Body grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          <LessonsList
            upcoming={upcomingLessons}
            past={pastLessons}
          />
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium">Beleške posle časova</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Posle svakog završenog časa, beleške ti dolaze ovde.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium">Uplate</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Evidencija svih uplata će biti ovde.
            </p>
          </div>
        </div>

        {/* Side panel: details */}
        <aside className="space-y-6">
          <Panel title="Obrazovanje">
            <Row icon={GraduationCap} label="Razred" value={s.grade} />
            <Row
              icon={School}
              label="Nivo"
              value={
                s.school
                  ? (EDUCATION_LABELS[s.school as EducationLevel] ?? s.school)
                  : null
              }
            />
          </Panel>
          <Panel title="Roditelj">
            <Row label="Ime" value={s.parent_name} />
            <Row icon={Phone} label="Telefon" value={s.parent_phone} />
            <Row icon={Mail} label="Email" value={s.parent_email} />
          </Panel>
          {s.notes && (
            <Panel title="Beleška o učeniku" icon={StickyNote}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {s.notes}
              </p>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.75} />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-medium tracking-tight tabular-nums mt-2">
        {value}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Banknote;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5 mb-3">
        {Icon && <Icon className="size-3" strokeWidth={2} />}
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function LessonsList({
  upcoming,
  past,
}: {
  upcoming: Lesson[];
  past: Lesson[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium">Časovi</h2>
      </div>
      {upcoming.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-secondary/30 border-b border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Predstojeći ({upcoming.length})
            </p>
          </div>
          <ul className="divide-y divide-border">
            {upcoming.map((l) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </ul>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-secondary/30 border-b border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Istorija ({past.length})
            </p>
          </div>
          <ul className="divide-y divide-border">
            {past.slice(0, 20).map((l) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </ul>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Još nema časova za ovog učenika.
          </p>
          <Link
            href="/schedule"
            className="text-xs text-foreground underline underline-offset-4 mt-2 inline-block"
          >
            Otvori raspored
          </Link>
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const dt = new Date(lesson.scheduled_at);
  return (
    <li className="px-5 py-3 flex items-center gap-4">
      <div className="text-xs tabular-nums w-24 shrink-0">
        <div className="text-muted-foreground">
          {dt.toLocaleDateString("sr-Latn-RS", {
            day: "numeric",
            month: "short",
          })}
        </div>
        <div className="font-medium">
          {dt.toLocaleTimeString("sr-Latn-RS", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <Badge variant="outline" className="font-normal text-[10px]">
          {LESSON_STATUS_LABELS[lesson.status as LessonStatus]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {lesson.duration_minutes} min
        </span>
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">
        {lesson.price > 0 ? formatRsd(lesson.price) : "—"}
      </div>
    </li>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Banknote;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && (
        <Icon
          className="size-3.5 text-muted-foreground mt-0.5 shrink-0"
          strokeWidth={1.75}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium break-words">{value}</div>
      </div>
    </div>
  );
}
