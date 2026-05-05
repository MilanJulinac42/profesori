import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Trash2,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getExerciseSet } from "@/lib/exercises/queries";
import { deleteExerciseSet } from "@/lib/exercises/actions";
import { DIFFICULTY_LABELS } from "@/lib/exercises/types";

export default async function ExerciseSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const set = await getExerciseSet(supabase, id);

  if (!set) notFound();

  const created = new Date(set.created_at);

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
      <Link
        href="/exercises"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Nazad na zadatke
      </Link>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl font-medium tracking-tight">{set.title}</h1>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-normal text-[10px]">
              {DIFFICULTY_LABELS[set.difficulty]}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3" strokeWidth={1.75} />
              {set.topic}
            </span>
            <span>·</span>
            <span>{set.grade_level}</span>
            <span>·</span>
            <span>{set.count} zadataka</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" strokeWidth={1.75} />
              {created.toLocaleDateString("sr-Latn-RS", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/exercises/${set.id}/print?solutions=hide`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <Printer className="size-3.5" strokeWidth={1.75} />
            Štampaj (bez rešenja)
          </Link>
          <Link
            href={`/exercises/${set.id}/print?solutions=show`}
            className={buttonVariants({ size: "sm" })}
          >
            <Printer className="size-3.5" strokeWidth={1.75} />
            Štampaj (sa rešenjima)
          </Link>
        </div>
      </header>

      {set.teacher_notes && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Napomena pri generisanju
          </p>
          <p className="text-sm whitespace-pre-wrap">{set.teacher_notes}</p>
        </div>
      )}

      <ol className="space-y-3">
        {set.exercises.map((ex, i) => (
          <li
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium tabular-nums text-muted-foreground shrink-0">
                {i + 1}.
              </span>
              <p className="text-sm whitespace-pre-wrap leading-relaxed flex-1 min-w-0">
                {ex.question}
              </p>
            </div>
            <div className="pl-7 space-y-2">
              <div className="rounded-md bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Rešenje
                </p>
                <p className="text-sm whitespace-pre-wrap font-medium">
                  {ex.solution}
                </p>
              </div>
              <details className="group">
                <summary className="text-xs text-muted-foreground hover:text-foreground cursor-pointer list-none inline-flex items-center gap-1">
                  <span className="group-open:hidden">Prikaži postupak</span>
                  <span className="hidden group-open:inline">Sakrij postupak</span>
                </summary>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-2">
                  {ex.explanation}
                </p>
              </details>
            </div>
          </li>
        ))}
      </ol>

      <footer className="flex items-center justify-between gap-3 pt-6 border-t border-border">
        <Link
          href="/exercises/new"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Sparkles className="size-3.5" strokeWidth={1.75} />
          Generiši još jedan set
        </Link>
        <form action={deleteExerciseSet.bind(null, set.id)}>
          <button
            type="submit"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Obriši
          </button>
        </form>
      </footer>
    </div>
  );
}
