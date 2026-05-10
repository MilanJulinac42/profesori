import { notFound } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import "katex/dist/katex.min.css";
import { ClipboardList, Clock, Check, Award, GraduationCap } from "lucide-react";
import { renderMathHtml } from "@/lib/exercises/math-render";
import {
  HOMEWORK_STATUS_LABELS,
  type HomeworkStatus,
} from "@/lib/homework/types";
import { cn } from "@/lib/utils";
import { SubmissionForm } from "./_components/submission-form";

type HomeworkPublic = {
  id: string;
  public_token: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: HomeworkStatus;
  submission_note: string | null;
  submission_images: string[];
  submitted_at: string | null;
  teacher_grade: number | null;
  teacher_feedback: string | null;
  graded_at: string | null;
  exercise_set_id: string | null;
  students: { full_name: string } | null;
};

type ExerciseSet = {
  title: string;
  exercises: { question: string; solution: string; explanation: string }[];
} | null;

async function fetchByToken(token: string): Promise<{
  hw: HomeworkPublic;
  teacherName: string;
  exerciseSet: ExerciseSet;
} | null> {
  // Service-role klijent — bypassa RLS. Public stranica je autorizovana
  // samo public_token-om (32-hex), ne user session-om.
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: hw } = await supabase
    .from("homework")
    .select(
      "id, public_token, title, description, due_date, status, submission_note, submission_images, submitted_at, teacher_grade, teacher_feedback, graded_at, exercise_set_id, organization_id, students(full_name)",
    )
    .eq("public_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (!hw) return null;
  const homework = hw as unknown as HomeworkPublic & { organization_id: string };

  // Teacher name (org owner)
  const { data: teacher } = await supabase
    .from("users")
    .select("full_name")
    .eq("organization_id", homework.organization_id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  let exerciseSet: ExerciseSet = null;
  if (homework.exercise_set_id) {
    const { data: set } = await supabase
      .from("exercise_sets")
      .select("title, exercises")
      .eq("id", homework.exercise_set_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (set) exerciseSet = set as ExerciseSet;
  }

  return {
    hw: homework,
    teacherName: (teacher?.full_name as string) ?? "Profesor",
    exerciseSet,
  };
}

export default async function PublicHomeworkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!/^[a-f0-9]{32}$/.test(token)) notFound();

  const data = await fetchByToken(token);
  if (!data) notFound();

  const { hw, teacherName, exerciseSet } = data;
  const studentName = hw.students?.full_name ?? "Učenik";

  const dueLabel = hw.due_date
    ? new Date(hw.due_date).toLocaleDateString("sr-Latn-RS", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const submitted = hw.status === "submitted" || hw.status === "graded";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-10 sm:py-16">
        {/* Logo header */}
        <div className="flex justify-center mb-10">
          <a
            href="https://profesori.rs"
            className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background shadow-[0_2px_8px_-2px_oklch(0_0_0/0.3)]">
              <GraduationCap className="size-4" strokeWidth={2} />
            </span>
            <span className="font-semibold tracking-tight">profesori.rs</span>
          </a>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl tile-violet shrink-0">
            <ClipboardList className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-1">
              Domaći zadatak
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">
              {hw.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Za:{" "}
              <strong className="text-foreground font-semibold">
                {studentName}
              </strong>
              {" · "}Profesor:{" "}
              <strong className="text-foreground font-semibold">
                {teacherName}
              </strong>
            </p>
          </div>
        </div>

        {/* Status / due */}
        <div className="card-elevated card-glow rounded-2xl p-4 sm:p-5 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <StatusBadge status={hw.status} />
          {dueLabel && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5" strokeWidth={1.75} />
              Rok:{" "}
              <strong className="text-foreground font-semibold">
                {dueLabel}
              </strong>
            </span>
          )}
        </div>

        {/* Description */}
        {hw.description && (
          <div className="card-elevated card-glow rounded-2xl p-5 mb-5">
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-2">
              Opis
            </p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
              {hw.description}
            </p>
          </div>
        )}

        {/* Exercise set (questions only, NO solutions) */}
        {exerciseSet && (
          <div className="card-elevated card-glow rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex size-8 items-center justify-center rounded-lg tile-cyan shrink-0">
                <ClipboardList className="size-4" strokeWidth={2} />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {exerciseSet.title}
              </p>
            </div>
            <ol className="space-y-3 list-decimal list-inside pl-1">
              {exerciseSet.exercises.map((ex, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  <span
                    className="inline"
                    dangerouslySetInnerHTML={{
                      __html: renderMathHtml(ex.question),
                    }}
                  />
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-muted-foreground mt-4 italic">
              (Rešenja se ne prikazuju ovde — uradi domaći u svesci.)
            </p>
          </div>
        )}

        {/* Already submitted state */}
        {submitted ? (
          <div className="card-elevated card-glow rounded-2xl p-5 mb-5 border-emerald-500/30 bg-emerald-500/5">
            <p className="text-sm font-semibold text-emerald-500 dark:text-emerald-400 inline-flex items-center gap-2">
              <Check className="size-4" strokeWidth={2.5} />
              {hw.status === "graded"
                ? "Profesor je već pregledao"
                : "Domaći je predat"}
            </p>
            {hw.submitted_at && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Predato:{" "}
                {new Date(hw.submitted_at).toLocaleString("sr-Latn-RS", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            {hw.submission_note && (
              <p className="text-sm italic text-foreground/85 mt-3 border-l-2 border-emerald-500/40 pl-3">
                „{hw.submission_note}"
              </p>
            )}
            {hw.submission_images && hw.submission_images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {hw.submission_images.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-md overflow-hidden border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`predata slika ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
            {hw.teacher_grade !== null && (
              <div className="mt-4 pt-4 border-t border-emerald-500/20">
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-emerald-500 dark:text-emerald-400 mb-1.5 inline-flex items-center gap-1.5">
                  <Award className="size-3" strokeWidth={2.5} />
                  Ocena
                </p>
                <p className="font-display text-4xl text-emerald-500 dark:text-emerald-400 tabular-nums leading-none">
                  {hw.teacher_grade}{" "}
                  <span className="text-2xl text-muted-foreground/80">/ 5</span>
                </p>
                {hw.teacher_feedback && (
                  <p className="text-sm text-foreground/85 mt-3 leading-relaxed whitespace-pre-wrap">
                    {hw.teacher_feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <SubmissionForm publicToken={hw.public_token} />
        )}

        <p className="text-[11px] text-muted-foreground/70 text-center mt-10">
          Aplikacija Profesori. Ovaj link je privatan — ne deli ga sa drugima.
        </p>
      </div>
    </div>
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        `tile-${tile}`,
      )}
    >
      {HOMEWORK_STATUS_LABELS[status]}
    </span>
  );
}
