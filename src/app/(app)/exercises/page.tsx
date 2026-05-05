import Link from "next/link";
import { Sparkles, Search, Filter, Plus, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listExerciseSets } from "@/lib/exercises/queries";
import {
  DIFFICULTY_LABELS,
  type Difficulty,
} from "@/lib/exercises/types";
import { cn } from "@/lib/utils";

type Search = {
  q?: string;
  difficulty?: string;
};

const FILTERS: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "Sve" },
  { value: "lako", label: "Lako" },
  { value: "srednje", label: "Srednje" },
  { value: "tesko", label: "Teško" },
  { value: "mesano", label: "Mešano" },
];

const VALID_DIFFICULTIES: Difficulty[] = ["lako", "srednje", "tesko", "mesano"];

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const difficulty = VALID_DIFFICULTIES.includes(params.difficulty as Difficulty)
    ? (params.difficulty as Difficulty)
    : null;

  const supabase = await createClient();
  const sets = await listExerciseSets(supabase, {
    q: q || undefined,
    difficulty: difficulty ?? undefined,
  });

  const hasFilters = !!(q || difficulty);

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
      <PageHeader
        title="Zadaci"
        description="AI generiše zadatke iz matematike. Sačuvaš u banku, štampaš, koristiš ponovo."
        actions={
          <Link
            href="/exercises/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Sparkles className="size-3.5" strokeWidth={2} />
            Generiši zadatke
          </Link>
        }
      />

      {sets.length > 0 || hasFilters ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <form className="relative flex-1 max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                strokeWidth={1.75}
              />
              <Input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Pretraži po naslovu ili temi..."
                className="pl-9"
              />
              {difficulty && (
                <input type="hidden" name="difficulty" value={difficulty} />
              )}
            </form>

            <div className="flex items-center gap-1 text-xs">
              <Filter
                className="size-3.5 text-muted-foreground mr-1"
                strokeWidth={1.75}
              />
              {FILTERS.map((f) => {
                const u = new URLSearchParams();
                if (q) u.set("q", q);
                if (f.value !== "all") u.set("difficulty", f.value);
                const qs = u.toString();
                const href = `/exercises${qs ? "?" + qs : ""}`;
                const active =
                  (f.value === "all" && !difficulty) || f.value === difficulty;
                return (
                  <Link
                    key={f.value}
                    href={href}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 transition-colors",
                      active
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                    )}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {sets.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nema rezultata"
              description="Probaj sa drugačijim filterima ili pretragom."
            />
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sets.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/exercises/${s.id}`}
                    className="block rounded-xl border border-border bg-card p-5 hover:border-foreground/20 hover:shadow-sm transition-all h-full"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <BookOpen
                        className="size-4 text-muted-foreground shrink-0 mt-0.5"
                        strokeWidth={1.75}
                      />
                      <Badge variant="outline" className="font-normal text-[10px]">
                        {DIFFICULTY_LABELS[s.difficulty]}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {s.topic} · {s.grade_level}
                    </p>
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                      <span>
                        {s.count} {s.count === 1 ? "zadatak" : s.count < 5 ? "zadatka" : "zadataka"}
                      </span>
                      <span>
                        {new Date(s.created_at).toLocaleDateString("sr-Latn-RS", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="Banka zadataka je prazna"
          description="Generiši prvi set zadataka — ostaće sačuvan ovde, možeš ga štampati ili ponovo koristiti za druge učenike."
          action={
            <Link href="/exercises/new" className={buttonVariants()}>
              <Plus className="size-4" strokeWidth={2} />
              Generiši prvi set
            </Link>
          }
        />
      )}
    </div>
  );
}
