import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isValid,
} from "date-fns";
import { srLatn } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { formatRsd } from "@/lib/money";
import { computeBillableStatuses } from "@/lib/payments/types";
import { getOrgSettings } from "@/lib/settings/queries";
import { AutoPrint, PrintButton } from "@/components/auto-print";
import type { Student } from "@/lib/students/types";

type Search = { month?: string };

export default async function MonthlyBillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const { month } = await searchParams;

  const supabase = await createClient();
  const { profile } = await requireUser();
  const teacherName = profile.full_name ?? "Profesor";

  // Resolve mesec
  const today = new Date();
  const monthAnchor =
    month && isValid(parseISO(month + "-01"))
      ? parseISO(month + "-01")
      : today;
  const periodStart = startOfMonth(monthAnchor);
  const periodEnd = endOfMonth(monthAnchor);

  // Student
  const { data: studentRaw } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!studentRaw) notFound();
  const student = studentRaw as Student;

  // Org settings → billable statuses
  const settings = await getOrgSettings(supabase, student.organization_id);
  const billableStatuses = computeBillableStatuses(settings);

  // Lessons u periodu
  const { data: lessonsRaw } = await supabase
    .from("lessons")
    .select(
      "id, scheduled_at, duration_minutes, status, price, topics_covered",
    )
    .eq("student_id", id)
    .is("deleted_at", null)
    .gte("scheduled_at", periodStart.toISOString())
    .lte("scheduled_at", periodEnd.toISOString())
    .order("scheduled_at", { ascending: true });

  const lessons = (lessonsRaw ?? []) as Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    price: number;
    topics_covered: string[] | null;
  }>;

  const billableLessons = lessons.filter((l) => (billableStatuses as readonly string[]).includes(l.status));
  const totalBillable = billableLessons.reduce((s, l) => s + l.price, 0);

  // Payments u periodu
  const { data: paymentsRaw } = await supabase
    .from("payments")
    .select("id, amount, paid_at, method, note")
    .eq("student_id", id)
    .gte("paid_at", periodStart.toISOString())
    .lte("paid_at", periodEnd.toISOString())
    .order("paid_at", { ascending: true });

  const payments = (paymentsRaw ?? []) as Array<{
    id: string;
    amount: number;
    paid_at: string;
    method: string | null;
    note: string | null;
  }>;
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  const monthLabel = format(periodStart, "LLLL yyyy.", { locale: srLatn });

  // Trenutni dug (preko cele istorije, do danas)
  const { data: allLessonsRaw } = await supabase
    .from("lessons")
    .select("status, price, scheduled_at")
    .eq("student_id", id)
    .is("deleted_at", null)
    .lte("scheduled_at", new Date().toISOString());
  const allLessons = (allLessonsRaw ?? []) as Array<{
    status: string;
    price: number;
  }>;
  const totalBillableEver = allLessons
    .filter((l) => (billableStatuses as readonly string[]).includes(l.status))
    .reduce((s, l) => s + l.price, 0);

  const { data: allPaymentsRaw } = await supabase
    .from("payments")
    .select("amount")
    .eq("student_id", id);
  const totalPaidEver = (allPaymentsRaw ?? []).reduce(
    (s: number, p: { amount: number }) => s + p.amount,
    0,
  );

  const currentDebt = totalBillableEver - totalPaidEver;

  return (
    <div className="bg-white text-black max-w-3xl mx-auto px-8 py-8 print:px-0 print:py-0 print:max-w-none">
      <AutoPrint />

      {/* Toolbar — vidljiv samo na ekranu */}
      <div className="print:hidden mb-6 flex items-center justify-between gap-3 pb-4 border-b border-border">
        <Link
          href={`/students/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Nazad na profil
        </Link>
        <PrintButton />
      </div>

      {/* Sadržaj */}
      <article className="space-y-6">
        <header className="space-y-2 pb-5 border-b border-black/30">
          <p className="text-xs uppercase tracking-wider text-black/60">
            Mesečni pregled
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {student.full_name}
            {student.grade && (
              <span className="font-normal text-black/60 ml-2 text-lg">
                · {student.grade}
              </span>
            )}
          </h1>
          <p className="text-sm">
            <span className="capitalize">{monthLabel}</span>
            {student.parent_name && (
              <>
                {" · "}roditelj: <strong>{student.parent_name}</strong>
              </>
            )}
          </p>
        </header>

        {/* Časovi tabela */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-black/60 mb-3">
            Časovi
          </h2>
          {billableLessons.length === 0 ? (
            <p className="text-sm text-black/60">
              U ovom mesecu nije bilo naplativih časova.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-black/20">
                  <th className="text-left py-2 font-medium">Datum</th>
                  <th className="text-left py-2 font-medium">Teme</th>
                  <th className="text-right py-2 font-medium">Trajanje</th>
                  <th className="text-right py-2 font-medium">Cena</th>
                </tr>
              </thead>
              <tbody>
                {billableLessons.map((l) => {
                  const dt = new Date(l.scheduled_at);
                  return (
                    <tr key={l.id} className="border-b border-black/10">
                      <td className="py-2.5 tabular-nums">
                        {format(dt, "EEE, d. MMM", { locale: srLatn })}
                      </td>
                      <td className="py-2.5 text-black/80">
                        {l.topics_covered && l.topics_covered.length > 0
                          ? l.topics_covered.join(", ")
                          : "—"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {l.duration_minutes} min
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-medium">
                        {formatRsd(l.price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-3 text-right font-medium">
                    Ukupno za {monthLabel.toLowerCase()}:
                  </td>
                  <td className="py-3 text-right text-lg font-semibold tabular-nums">
                    {formatRsd(totalBillable)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* Plaćanja u mesecu */}
        {payments.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-black/60 mb-3">
              Uplate u ovom mesecu
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-black/20">
                  <th className="text-left py-2 font-medium">Datum</th>
                  <th className="text-left py-2 font-medium">Način</th>
                  <th className="text-left py-2 font-medium">Napomena</th>
                  <th className="text-right py-2 font-medium">Iznos</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-black/10">
                    <td className="py-2.5 tabular-nums">
                      {format(new Date(p.paid_at), "d. MMM yyyy.", {
                        locale: srLatn,
                      })}
                    </td>
                    <td className="py-2.5 text-black/80">{p.method ?? "Keš"}</td>
                    <td className="py-2.5 text-black/60">{p.note ?? "—"}</td>
                    <td className="py-2.5 text-right tabular-nums font-medium">
                      {formatRsd(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-3 text-right font-medium">
                    Ukupno uplaćeno u mesecu:
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium">
                    {formatRsd(totalPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        {/* Sumarno stanje */}
        <section className="rounded-lg border-2 border-black/20 p-5">
          <h2 className="text-xs uppercase tracking-wider text-black/60 mb-3">
            Trenutno stanje
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Naplativi časovi (do danas, ukupno):</span>
              <span className="tabular-nums">{formatRsd(totalBillableEver)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ukupno uplaćeno (do danas):</span>
              <span className="tabular-nums">{formatRsd(totalPaidEver)}</span>
            </div>
            <div className="border-t border-black/20 pt-2 flex justify-between">
              <span className="font-medium">
                {currentDebt > 0
                  ? "Trenutni dug:"
                  : currentDebt < 0
                    ? "Pretplata:"
                    : "Saldo:"}
              </span>
              <span
                className={`text-lg font-semibold tabular-nums ${
                  currentDebt > 0 ? "text-[#a00]" : ""
                }`}
              >
                {formatRsd(Math.abs(currentDebt))}
              </span>
            </div>
          </div>
        </section>

        {/* Disclaimer + potpis */}
        <section className="space-y-3 pt-4 border-t border-black/20">
          <p className="text-[11px] text-black/60 leading-relaxed">
            <strong>Napomena:</strong> Ovo je interna evidencija profesora —
            nije fiskalni račun. Sve transakcije se obavljaju gotovinski,
            direktno između profesora i roditelja/učenika.
          </p>
          <p className="text-sm pt-2">
            <strong>{teacherName}</strong>
          </p>
        </section>
      </article>
    </div>
  );
}
