import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getRecentTopics } from "@/lib/lessons/queries";
import type { Lesson } from "@/lib/lessons/types";
import { NoteCaptureScreen } from "./_components/screen";

export default async function LessonNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("*, students(id, full_name, grade)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) notFound();

  const lesson = data as Lesson & {
    students: { id: string; full_name: string; grade: string | null } | null;
  };

  const topicSuggestions = await getRecentTopics(supabase);

  const dt = parseISO(lesson.scheduled_at);

  return (
    <div className="min-h-full px-4 sm:px-8 py-6 max-w-2xl mx-auto w-full space-y-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Nazad
      </Link>

      <header className="space-y-2 pb-4 border-b border-border">
        <h1 className="text-2xl font-medium tracking-tight">
          Beleška: {lesson.students?.full_name ?? "Učenik"}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" strokeWidth={1.75} />
            {format(dt, "EEEE, d. MMMM yyyy.", { locale: sr })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" strokeWidth={1.75} />
            {format(dt, "HH:mm")} · {lesson.duration_minutes} min
          </span>
          {lesson.students?.grade && <span>· {lesson.students.grade}</span>}
        </div>
      </header>

      <NoteCaptureScreen
        lessonId={lesson.id}
        topicSuggestions={topicSuggestions}
        initial={{
          notes_after_lesson: lesson.notes_after_lesson,
          topics_covered: lesson.topics_covered ?? [],
          progress_summary: lesson.progress_summary,
          next_lesson_plan: lesson.next_lesson_plan,
          lesson_rating: lesson.lesson_rating,
        }}
      />
    </div>
  );
}
