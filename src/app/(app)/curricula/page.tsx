import Link from "next/link";
import { Compass, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { listOrgCurricula } from "@/lib/curriculum/queries";
import { createCurriculumAction } from "@/lib/curriculum/actions";

type SortKey = "updated" | "name" | "students";

const TILE_PALETTE = ["violet", "cyan", "emerald", "amber", "sky", "magenta", "rose"] as const;

function stableHueIndex(s: string): number {
  // Simple deterministic hash → palette index.
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % TILE_PALETTE.length;
}

export default async function CurriculaListPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const sp = await searchParams;
  const sort: SortKey =
    sp.sort === "name" || sp.sort === "students" ? sp.sort : "updated";

  const supabase = await createClient();
  const all = await listOrgCurricula(supabase);
  if (sort === "name") {
    all.sort((a, b) => a.name.localeCompare(b.name, "sr-Latn"));
  } else if (sort === "students") {
    all.sort((a, b) => b.students_count - a.students_count);
  }
  // "updated" — listOrgCurricula already orders by updated_at desc.
  const active = all.filter((c) => c.is_active);
  const drafts = all.filter((c) => !c.is_active);

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Kurikulumi"
        description="Definiši predmet i razred kao spisak tema. Dodeli učeniku i prati napredak kroz lekcije."
        actions={
          <form action={createCurriculumAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              Novi kurikulum
            </button>
          </form>
        }
      />

      {all.length > 1 && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Sortiraj:</span>
          {(
            [
              { v: "updated", l: "Najnovije" },
              { v: "name", l: "Naziv" },
              { v: "students", l: "Po broju učenika" },
            ] as const
          ).map((s) => (
            <Link
              key={s.v}
              href={s.v === "updated" ? "/curricula" : `/curricula?sort=${s.v}`}
              className={
                sort === s.v
                  ? "px-2 py-0.5 rounded-md bg-secondary text-foreground font-medium"
                  : "px-2 py-0.5 rounded-md text-muted-foreground hover:text-foreground"
              }
            >
              {s.l}
            </Link>
          ))}
        </div>
      )}

      {all.length === 0 ? (
        <EmptyState
          icon={Compass}
          tile="violet"
          title="Još nema kurikuluma"
          description="Napravi prvi kurikulum (npr. „Matematika 8. razred“) i organizuj gradivo po sekcijama i podtemama."
          action={
            <form action={createCurriculumAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
              >
                <Plus className="size-3.5" strokeWidth={2.25} />
                Napravi prvi kurikulum
              </button>
            </form>
          }
        />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-3 px-1">
                Aktivni ({active.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((c) => (
                  <CurriculumCard key={c.id} c={c} />
                ))}
              </div>
            </section>
          )}

          {drafts.length > 0 && (
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-3 px-1">
                Skice ({drafts.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((c) => (
                  <CurriculumCard key={c.id} c={c} draft />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CurriculumCard({
  c,
  draft = false,
}: {
  c: Awaited<ReturnType<typeof listOrgCurricula>>[number];
  draft?: boolean;
}) {
  const tile = TILE_PALETTE[stableHueIndex(c.subject + c.name)];
  return (
    <Link
      href={`/curricula/${c.id}`}
      className="group card-elevated card-glow rounded-2xl p-5 flex flex-col gap-3 transition-all hover:translate-y-[-2px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl tile-${tile}`}>
          <Compass className="size-5" strokeWidth={2} />
        </div>
        {draft && (
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
            Skica
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-lg text-foreground truncate">
          {c.name || "Bez imena"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {[c.subject, c.grade_label].filter(Boolean).join(" · ") || "Bez predmeta"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto pt-1 text-xs text-muted-foreground tabular-nums">
        <span>
          {c.sections_count} sek · {c.units_count} tema
        </span>
        <span>
          {c.students_count > 0
            ? `${c.students_count} ${c.students_count === 1 ? "učenik" : "učenika"}`
            : "—"}
        </span>
      </div>
    </Link>
  );
}
