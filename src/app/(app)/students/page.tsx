import Link from "next/link";
import { Plus, Users, Search, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRsd } from "@/lib/money";
import { STATUS_LABELS, type Student, type StudentStatus } from "@/lib/students/types";
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

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = (params.status as StudentStatus) ?? null;

  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("*")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("full_name", `%${q}%`);

  const { data: students, error } = await query;
  const list = (students as Student[] | null) ?? [];

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
      <PageHeader
        title="Učenici"
        description="Lista učenika, kontakti i osnovni podaci."
        actions={
          <Link href="/students/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="size-3.5" strokeWidth={2} />
            Dodaj učenika
          </Link>
        }
      />

      {/* Filters */}
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
            placeholder="Pretraži po imenu..."
            className="pl-9"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>

        <div className="flex items-center gap-1 text-xs">
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

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Greška: {error.message}
        </div>
      )}

      {list.length === 0 ? (
        q || status ? (
          <EmptyState
            icon={Search}
            title="Nema rezultata"
            description="Probaj sa drugačijim filterima ili pretragom."
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Još nemaš učenika"
            description="Dodaj prvog učenika i sve što unosiš ovde će biti vezano za njega: časovi, beleške, naplata, opomene."
            action={
              <Link href="/students/new" className={buttonVariants()}>
                <Plus className="size-4" strokeWidth={2} />
                Dodaj učenika
              </Link>
            }
          />
        )
      ) : (
        <StudentsTable students={list} />
      )}

      {list.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {list.length} {list.length === 1 ? "učenik" : list.length < 5 ? "učenika" : "učenika"}
        </p>
      )}
    </div>
  );
}

function StudentsTable({ students }: { students: Student[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-xs text-muted-foreground">
          <tr>
            <th className="text-left font-medium px-4 py-2.5">Ime</th>
            <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">
              Razred
            </th>
            <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">
              Roditelj
            </th>
            <th className="text-right font-medium px-4 py-2.5 hidden sm:table-cell">
              Cena
            </th>
            <th className="text-right font-medium px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {students.map((s) => (
            <tr
              key={s.id}
              className="hover:bg-secondary/30 transition-colors group"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/students/${s.id}`}
                  className="font-medium hover:underline underline-offset-4"
                >
                  {s.full_name}
                </Link>
                {s.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                {s.grade ?? "—"}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                {s.parent_name ?? "—"}
                {s.parent_phone && (
                  <div className="text-xs">{s.parent_phone}</div>
                )}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-right tabular-nums text-muted-foreground">
                {s.default_price_per_lesson > 0
                  ? formatRsd(s.default_price_per_lesson)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <StatusBadge status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: StudentStatus }) {
  const variant =
    status === "active"
      ? "default"
      : status === "paused"
        ? "secondary"
        : "outline";
  return (
    <Badge variant={variant} className="font-normal">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
