import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getExerciseSet } from "@/lib/exercises/queries";
import { DIFFICULTY_LABELS } from "@/lib/exercises/types";
import { AutoPrint, PrintButton } from "./_components/auto-print";

type Search = { solutions?: string };

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const { solutions } = await searchParams;
  const showSolutions = solutions === "show";

  const supabase = await createClient();
  const set = await getExerciseSet(supabase, id);
  if (!set) notFound();

  return (
    <div className="bg-white text-black max-w-3xl mx-auto px-8 py-8 print:px-0 print:py-0 print:max-w-none">
      <AutoPrint />

      {/* Toolbar — vidljiv samo na ekranu */}
      <div className="print:hidden mb-6 flex items-center justify-between gap-3 pb-4 border-b border-border">
        <Link
          href={`/exercises/${set.id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Nazad
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={`/exercises/${set.id}/print?solutions=hide`}
            className={`underline-offset-4 ${!showSolutions ? "font-medium underline" : "text-muted-foreground hover:underline"}`}
          >
            Bez rešenja
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href={`/exercises/${set.id}/print?solutions=show`}
            className={`underline-offset-4 ${showSolutions ? "font-medium underline" : "text-muted-foreground hover:underline"}`}
          >
            Sa rešenjima
          </Link>
        </div>
        <PrintButton />
      </div>

      {/* Print sadržaj */}
      <article className="space-y-6">
        <header className="space-y-1.5 pb-4 border-b border-black/30">
          <h1 className="text-2xl font-semibold tracking-tight">{set.title}</h1>
          <p className="text-sm">
            {set.topic} · {set.grade_level} ·{" "}
            {DIFFICULTY_LABELS[set.difficulty]} · {set.count} zadataka
          </p>

          {/* Polja za upisivanje (samo bez rešenja) */}
          {!showSolutions && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mt-4 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">Ime i prezime:</span>
                <span className="flex-1 border-b border-black/40 h-5" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-medium">Datum:</span>
                <span className="flex-1 border-b border-black/40 h-5" />
              </div>
            </div>
          )}
        </header>

        <ol className="space-y-5 list-decimal list-inside pl-2">
          {set.exercises.map((ex, i) => (
            <li key={i} className="break-inside-avoid">
              <div className="inline">
                <p className="inline whitespace-pre-wrap leading-relaxed text-[15px]">
                  {ex.question}
                </p>
              </div>

              {showSolutions ? (
                <div className="mt-2 ml-6 pl-3 border-l-2 border-black/30 space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Rešenje: </span>
                    <span className="whitespace-pre-wrap">{ex.solution}</span>
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    <span className="font-semibold">Postupak: </span>
                    {ex.explanation}
                  </p>
                </div>
              ) : (
                <div className="mt-2 ml-6 space-y-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="border-b border-black/20 h-6" />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </article>
    </div>
  );
}

