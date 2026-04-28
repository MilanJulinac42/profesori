import Link from "next/link";
import {
  Banknote,
  AlertCircle,
  Phone,
  Mail,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getOrgDebtors } from "@/lib/payments/queries";
import { formatRsd } from "@/lib/money";
import { cn } from "@/lib/utils";

export default async function BillingPage() {
  const supabase = await createClient();
  const { totalDebt, totalCredit, debtors } = await getOrgDebtors(supabase);

  // Categorize by oldest unpaid age.
  const now = Date.now();
  const overThirtyDays = debtors.filter((d) => {
    if (!d.oldestUnpaidAt) return false;
    const days = (now - new Date(d.oldestUnpaidAt).getTime()) / 86400000;
    return days > 30;
  });

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
      <PageHeader
        title="Naplata"
        description="Pregled dugovanja, evidentiranje uplata i opomene."
      />

      <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
        <p className="font-medium">Ovo je samo evidencija.</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Novac primaš direktno od učenika ili roditelja. Platforma ne procesuje
          uplate.
        </p>
      </div>

      {/* Top metrics */}
      <section className="grid gap-3 sm:grid-cols-3">
        <BillingStat
          label="Ukupan dug"
          value={formatRsd(totalDebt, false)}
          unit="RSD"
          icon={Banknote}
          hint={
            debtors.length > 0
              ? `${debtors.length} ${debtors.length === 1 ? "učenik duguje" : "učenika dugu"}`
              : "Niko ne duguje"
          }
        />
        <BillingStat
          label="Stari dugovi (>30 dana)"
          value={String(overThirtyDays.length)}
          icon={AlertCircle}
          hint={
            overThirtyDays.length > 0
              ? `${formatRsd(overThirtyDays.reduce((s, d) => s + d.debt, 0))}`
              : "Nema starih dugovanja"
          }
          tone={overThirtyDays.length > 0 ? "warning" : "default"}
        />
        <BillingStat
          label="Pretplate (kredit)"
          value={formatRsd(totalCredit, false)}
          unit="RSD"
          icon={TrendingUp}
          hint="Učenici koji su preplatili"
        />
      </section>

      {/* Debtors list */}
      {debtors.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Niko ne duguje"
          description="Kad obeležiš čas kao održan a još nema uplate, učenik se pojavljuje ovde."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium">Učenici sa dugom</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sortirano po visini duga.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {debtors.map((d) => {
              const ageDays = d.oldestUnpaidAt
                ? Math.floor(
                    (now - new Date(d.oldestUnpaidAt).getTime()) / 86400000,
                  )
                : 0;
              const isOld = ageDays > 30;
              return (
                <li key={d.student_id}>
                  <Link
                    href={`/students/${d.student_id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 transition-colors"
                  >
                    <Avatar name={d.full_name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {d.full_name}
                        </p>
                        {isOld && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-destructive">
                            <AlertCircle
                              className="size-3"
                              strokeWidth={2}
                            />
                            {ageDays} dana
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.unpaidLessonsCount}{" "}
                        {d.unpaidLessonsCount === 1
                          ? "neplaćen čas"
                          : d.unpaidLessonsCount < 5
                            ? "neplaćena časa"
                            : "neplaćenih časova"}
                        {d.parent_phone && (
                          <>
                            {" · "}
                            <span className="inline-flex items-center gap-1">
                              <Phone className="size-3" strokeWidth={1.75} />
                              {d.parent_phone}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          "text-base font-medium tabular-nums",
                          isOld && "text-destructive",
                        )}
                      >
                        {formatRsd(d.debt)}
                      </p>
                      <ArrowRight
                        className="size-3.5 text-muted-foreground/40 group-hover:text-foreground inline-block mt-0.5"
                        strokeWidth={1.75}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function BillingStat({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: typeof Banknote;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 min-h-[110px]">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs">{label}</span>
        <Icon
          className={cn(
            "size-3.5",
            tone === "warning" && "text-destructive",
          )}
          strokeWidth={1.75}
        />
      </div>
      <div className="flex items-baseline gap-1.5 mt-auto">
        <span
          className={cn(
            "text-2xl font-medium tracking-tight tabular-nums",
            tone === "warning" && "text-destructive",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && (
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {hint}
        </p>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
      {initials || "?"}
    </span>
  );
}
