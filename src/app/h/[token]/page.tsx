import { notFound } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import "katex/dist/katex.min.css";
import { ClipboardList, Clock, Check, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-[#f6f6f4]">
      <div className="max-w-2xl mx-auto px-5 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Domaći zadatak
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {hw.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Za: <strong className="text-foreground">{studentName}</strong>
            {" · "}Profesor: <strong className="text-foreground">{teacherName}</strong>
          </p>
        </div>

        {/* Status / due */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <StatusBadge status={hw.status} />
          {dueLabel && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5" strokeWidth={1.75} />
              Rok: <strong className="text-foreground">{dueLabel}</strong>
            </span>
          )}
        </div>

        {/* Description */}
        {hw.description && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Opis
            </p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {hw.description}
            </p>
          </div>
        )}

        {/* Exercise set (questions only, NO solutions) */}
        {exerciseSet && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList
                className="size-4 text-muted-foreground"
                strokeWidth={1.75}
              />
              <p className="text-sm font-medium">{exerciseSet.title}</p>
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
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 mb-6">
            <p className="text-sm font-medium text-emerald-900 inline-flex items-center gap-2">
              <Check className="size-4" strokeWidth={2.5} />
              {hw.status === "graded"
                ? "Profesor je već pregledao"
                : "Domaći je predat"}
            </p>
            {hw.submitted_at && (
              <p className="text-xs text-emerald-800 mt-1">
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
              <p className="text-sm italic text-emerald-900 mt-3 border-l-2 border-emerald-300 pl-3">
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
                    className="relative aspect-square rounded-md overflow-hidden border border-emerald-300"
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
              <div className="mt-4 pt-3 border-t border-emerald-300">
                <p className="text-xs uppercase tracking-wider text-emerald-700 mb-1 inline-flex items-center gap-1.5">
                  <Award className="size-3" strokeWidth={2} />
                  Ocena
                </p>
                <p className="text-2xl font-semibold text-emerald-900 tabular-nums">
                  {hw.teacher_grade} / 5
                </p>
                {hw.teacher_feedback && (
                  <p className="text-sm text-emerald-900 mt-2 leading-relaxed whitespace-pre-wrap">
                    {hw.teacher_feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <SubmissionForm publicToken={hw.public_token} />
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-8">
          Aplikacija Profesori. Ovaj link je privatan — ne deli ga sa drugima.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: HomeworkStatus }) {
  const tone =
    status === "submitted"
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : status === "graded"
        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
        : status === "skipped"
          ? "bg-secondary text-muted-foreground border-border"
          : "bg-secondary text-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-normal", tone)}>
      {HOMEWORK_STATUS_LABELS[status]}
    </Badge>
  );
}
