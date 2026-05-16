import Link from "next/link";
import {
  Plus,
  Users,
  Search,
  Filter,
  Phone,
  ArrowRight,
  Pause,
  Banknote,
  TrendingUp,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatRsd } from "@/lib/money";
import {
  STATUS_LABELS,
  type Student,
  type StudentStatus,
} from "@/lib/students/types";
import { cn } from "@/lib/utils";

type Search = {
  q?: string;
  status?: string;
};

const FILTERS: { value: StudentStatus | "all"; label: string }[] = [
  { value: "all", label: "Svi" },
  { value: "active", label: "Aktivni" },
  { value: "paused", label: "Pauzirani" },
  { value: "inactive", label: "Neaktivni" },
];

const STATUS_TILE: Record<StudentStatus, "emerald" | "amber" | "rose"> = {
  active: "emerald",
  paused: "amber",
  inactive: "rose",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = (params.status as StudentStatus) ?? null;

  const supabase = await createClient();

  // Pull ALL non-deleted students for stats. Filter visible list separately.
  const { data: allStudents, error } = await supabase
    .from("students")
    .select("*")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });
  const all = (allStudents as Student[] | null) ?? [];

  // Apply filters for the visible list
  const list = all.filter((s) => {
    if (status && s.status !== status) return false;
    if (q && !s.full_name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  // Stats — only relevant from active students mostly
  const activeStudents = all.filter((s) => s.status === "active");
  const pausedCount = all.filter((s) => s.status === "paused").length;
  const monthlyPotential = activeStudents.reduce(
    (sum, s) => sum + s.default_price_per_lesson * 4,
    0,
  );
  const avgPrice =
    activeStudents.length > 0
      ? Math.round(
          activeStudents.reduce(
            (sum, s) => sum + s.default_price_per_lesson,
            0,
          ) / activeStudents.length,
        )
      : 0;

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Učenici"
        description="Lista učenika, kontakti i osnovni podaci."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/students/import"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
            >
              <Upload className="size-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Uvezi CSV</span>
            </Link>
            <Link
              href="/students/new"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              Dodaj učenika
            </Link>
          </div>
        }
      />

      {/* Stat strip */}
      {all.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Aktivni"
            value={String(activeStudents.length)}
            icon={Users}
            tile="cyan"
            hint={`${all.length} ukupno`}
          />
          <StatCard
            label="Pauzirani"
            value={String(pausedCount)}
            icon={Pause}
            tile="amber"
            hint={pausedCount === 0 ? "nema pauziranih" : "trenutno"}
          />
          <StatCard
            label="Mesečni potencijal"
            value={formatRsd(monthlyPotential, false)}
            unit="RSD"
            icon={TrendingUp}
            tile="emerald"
            hint="~4 časa po učeniku"
          />
          <StatCard
            label="Prosečna cena"
            value={avgPrice > 0 ? formatRsd(avgPrice, false) : "—"}
            unit={avgPrice > 0 ? "RSD" : undefined}
            icon={Banknote}
            tile="violet"
            hint="po času"
          />
        </div>
      )}

      {/* Search + filters */}
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
            placeholder="Pretraži po imenu…"
            className="pl-9 bg-secondary/50 border-border/60 focus-visible:border-brand/60"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>

        <div className="flex items-center gap-1 text-xs flex-wrap">
          <Filter
            className="size-3.5 text-muted-foreground mr-1"
            strokeWidth={1.75}
          />
          {FILTERS.map((f) => {
            const href = (() => {
              const u = new URLSearchParams();
              if (q) u.set("q", q);
              if (f.value !== "all") u.set("status", f.value);
              const qs = u.toString();
              return `/students${qs ? "?" + qs : ""}`;
            })();
            const active =
              (f.value === "all" && !status) || f.value === status;
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

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Greška: {error.message}
        </div>
      )}

      {list.length === 0 ? (
        q || status ? (
          <EmptyState
            icon={Search}
            tile="violet"
            title="Nema rezultata"
            description="Probaj sa drugačijim filterima ili pretragom."
          />
        ) : (
          <EmptyState
            icon={Users}
            tile="cyan"
            title="Još nemaš učenika"
            description="Dodaj prvog učenika i sve što unosiš ovde će biti vezano za njega: časovi, beleške, naplata, opomene."
            action={
              <Link
                href="/students/new"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
              >
                <Plus className="size-3.5" strokeWidth={2.25} />
                Dodaj učenika
              </Link>
            }
          />
        )
      ) : (
        <StudentsList students={list} />
      )}

      {list.length > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {list.length}{" "}
          {list.length === 1
            ? "učenik"
            : list.length < 5
              ? "učenika"
              : "učenika"}
          {list.length !== all.length && (
            <span className="text-muted-foreground/60">
              {" "}
              · {all.length} ukupno
            </span>
          )}
        </p>
      )}
    </div>
  );
}

/* ---------- LIST ---------- */
function StudentsList({ students }: { students: Student[] }) {
  return (
    <div className="card-elevated card-glow rounded-2xl overflow-hidden">
      {/* Header row (desktop) */}
      <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-secondary/30">
        <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
          Učenik
        </p>
        <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
          Roditelj
        </p>
        <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground text-right w-20">
          Cena
        </p>
        <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground text-right w-24">
          Status
        </p>
        <span className="w-5" aria-hidden />
      </div>

      <ul className="divide-y divide-border">
        {students.map((s, idx) => (
          <li
            key={s.id}
            data-tour={idx === 0 ? "students-first-row" : undefined}
          >
            <Link
              href={`/students/${s.id}`}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto_auto] gap-3 md:gap-4 items-center px-5 py-3.5 hover:bg-secondary/30 transition-colors group"
            >
              {/* Student: avatar + name + grade + tags */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={s.full_name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">
                    {s.full_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                    {s.grade && (
                      <span className="truncate">{s.grade}</span>
                    )}
                    {s.tags.length > 0 && (
                      <>
                        {s.grade && <span aria-hidden>·</span>}
                        <div className="flex gap-1 min-w-0 flex-wrap">
                          {s.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                          {s.tags.length > 2 && (
                            <span className="text-[10px] text-muted-foreground/70">
                              +{s.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Parent */}
              <div className="hidden md:block min-w-0 text-sm">
                {s.parent_name ? (
                  <>
                    <p className="text-foreground/90 truncate">
                      {s.parent_name}
                    </p>
                    {s.parent_phone && (
                      <p className="text-xs text-muted-foreground tabular-nums inline-flex items-center gap-1 mt-0.5">
                        <Phone
                          className="size-3 text-muted-foreground/60"
                          strokeWidth={1.75}
                        />
                        {s.parent_phone}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground/60 text-xs">—</span>
                )}
              </div>

              {/* Price */}
              <div className="hidden md:block text-right tabular-nums w-20">
                {s.default_price_per_lesson > 0 ? (
                  <span className="text-sm font-semibold text-foreground">
                    {formatRsd(s.default_price_per_lesson, false)}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60 text-xs">—</span>
                )}
              </div>

              {/* Status */}
              <div className="md:w-24 md:text-right">
                <StatusPill status={s.status} />
              </div>

              {/* Arrow on hover */}
              <ArrowRight
                className="hidden md:block size-4 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                strokeWidth={1.75}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusPill({ status }: { status: StudentStatus }) {
  const tile = STATUS_TILE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        `tile-${tile}`,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "active" && "bg-emerald-500 dark:bg-emerald-400",
          status === "paused" && "bg-amber-500 dark:bg-amber-400",
          status === "inactive" && "bg-rose-500 dark:bg-rose-400",
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
