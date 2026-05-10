import Link from "next/link";
import { Sparkles, Search, Filter, Plus, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { listExerciseSets } from "@/lib/exercises/queries";
import {
  DIFFICULTY_LABELS,
  type Difficulty,
} from "@/lib/exercises/types";
import { cn } from "@/lib/utils";

const DIFFICULTY_TILE: Record<Difficulty, "emerald" | "cyan" | "rose" | "violet"> = {
  lako: "emerald",
  srednje: "cyan",
  tesko: "rose",
  mesano: "violet",
};

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
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Zadaci"
        description="AI generiše zadatke iz matematike. Sačuvaš u banku, štampaš, koristiš ponovo."
        actions={
          <Link
            href="/exercises/new"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
          >
            <Sparkles className="size-3.5" strokeWidth={2.25} />
            Generiši zadatke
          </Link>
        }
      />

      {sets.length > 0 || hasFilters ? (
        <>
          <div className="card-elevated rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <form className="relative flex-1 max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 pointer-events-none"
                strokeWidth={1.75}
              />
              <Input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Pretraži po naslovu ili temi…"
                className="pl-9 bg-secondary/50 border-border/60 focus-visible:border-brand/60"
              />
              {difficulty && (
                <input type="hidden" name="difficulty" value={difficulty} />
              )}
            </form>

            <div className="flex items-center gap-1 text-xs flex-wrap">
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
                      "rounded-md px-2.5 py-1.5 transition-all",
                      active
                        ? "bg-brand text-brand-foreground font-semibold shadow-[0_2px_8px_-2px_oklch(0.78_0.16_205/0.4)]"
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
              tile="violet"
              title="Nema rezultata"
              description="Probaj sa drugačijim filterima ili pretragom."
            />
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sets.map((s) => {
                const tile = DIFFICULTY_TILE[s.difficulty];
                return (
                  <li key={s.id}>
                    <Link
                      href={`/exercises/${s.id}`}
                      className="card-elevated card-glow rounded-2xl p-5 flex flex-col h-full transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_20px_48px_-16px_oklch(0_0_0/0.4)] group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-xl shrink-0",
                            `tile-${tile}`,
                          )}
                        >
                          <BookOpen className="size-5" strokeWidth={2} />
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            `tile-${tile}`,
                          )}
                        >
                          {DIFFICULTY_LABELS[s.difficulty]}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[0.95rem] leading-snug line-clamp-2 mb-1 text-foreground">
                        {s.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {s.topic} · {s.grade_level}
                      </p>
                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                        <span className="font-semibold text-foreground">
                          {s.count}{" "}
                          {s.count === 1
                            ? "zadatak"
                            : s.count < 5
                              ? "zadatka"
                              : "zadataka"}
                        </span>
                        <span>
                          {new Date(s.created_at).toLocaleDateString(
                            "sr-Latn-RS",
                            {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <EmptyState
          icon={Sparkles}
          tile="violet"
          title="Banka zadataka je prazna"
          description="Generiši prvi set zadataka — ostaće sačuvan ovde, možeš ga štampati ili ponovo koristiti za druge učenike."
          action={
            <Link
              href="/exercises/new"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              Generiši prvi set
            </Link>
          }
        />
      )}
    </div>
  );
}
