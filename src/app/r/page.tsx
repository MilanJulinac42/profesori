import { redirect } from "next/navigation";
import {
  Calendar,
  Mail,
  ClipboardList,
  Banknote,
  GraduationCap,
} from "lucide-react";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getParentSession } from "@/lib/parent-portal/auth";
import { formatRsd } from "@/lib/money";
import { computeBillableStatuses } from "@/lib/payments/types";
import { getOrgSettings } from "@/lib/settings/queries";
import Link from "next/link";
import { ParentReportRow } from "./_components/report-row";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export default async function ParentDashboard() {
  const session = await getParentSession();
  if (!session) redirect("/r/expired");

  const supabase = getServiceClient();
  const { studentId, studentName, parentName, teacherName, organizationId } =
    session;

  // Stat za poslednjih 30 dana
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const settings = await getOrgSettings(supabase, organizationId);
  const billableStatuses = computeBillableStatuses(settings);

  const [lessonsRes, hwRes, reportsRes, paymentsRes, billableRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, scheduled_at, duration_minutes, status, lesson_rating")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .gte("scheduled_at", since.toISOString())
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("homework")
      .select("id, title, status, public_token, due_date, created_at")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("report_logs")
      .select("id, kind, period_start, period_end, status, sent_at, html_body")
      .eq("student_id", studentId)
      .in("status", ["sent", "draft"])
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("payments")
      .select("amount")
      .eq("student_id", studentId),
    supabase
      .from("lessons")
      .select("status, price")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .lte("scheduled_at", new Date().toISOString()),
  ]);

  const lessons = (lessonsRes.data ?? []) as Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    lesson_rating: number | null;
  }>;
  const homework = (hwRes.data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    public_token: string;
    due_date: string | null;
    created_at: string;
  }>;
  const reports = (reportsRes.data ?? []) as Array<{
    id: string;
    kind: string;
    period_start: string;
    period_end: string;
    sent_at: string;
  }>;

  const completedRecent = lessons.filter((l) => l.status === "completed").length;
  const totalMinutesRecent = lessons
    .filter((l) => l.status === "completed")
    .reduce((s, l) => s + l.duration_minutes, 0);

  const totalPaid = (paymentsRes.data ?? []).reduce(
    (s: number, p: { amount: number }) => s + p.amount,
    0,
  );
  const totalBillable = ((billableRes.data ?? []) as { status: string; price: number }[])
    .filter((l) => (billableStatuses as readonly string[]).includes(l.status))
    .reduce((s, l) => s + l.price, 0);
  const debt = totalBillable - totalPaid;

  const greeting = parentName ? `Pozdrav, ${parentName}` : `Dobro došli`;

  return (
    <div className="min-h-screen bg-[#f6f6f4]">
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Roditeljski portal
          </p>
          <h1 className="text-xl font-semibold mt-1">{greeting}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pregled rada za <strong>{studentName}</strong> · Profesor:{" "}
            <strong>{teacherName}</strong>
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {/* Statistika za poslednjih 30 dana */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Poslednjih 30 dana
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              icon={GraduationCap}
              label="Časova"
              value={completedRecent.toString()}
            />
            <Stat
              icon={Calendar}
              label="Minuta"
              value={totalMinutesRecent.toString()}
            />
            <Stat
              icon={ClipboardList}
              label="Domaćih"
              value={String(homework.length)}
            />
            <Stat
              icon={Banknote}
              label={debt > 0 ? "Dug" : debt < 0 ? "Pretplata" : "Saldo"}
              value={formatRsd(Math.abs(debt))}
              accent={debt > 0 ? "warn" : "ok"}
            />
          </div>
        </section>

        {/* Izveštaji */}
        {reports.length > 0 && (
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium inline-flex items-center gap-2">
                <Mail className="size-3.5" strokeWidth={1.75} />
                Poslati izveštaji
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {reports.map((r) => (
                <ParentReportRow key={r.id} report={r} />
              ))}
            </ul>
          </section>
        )}

        {/* Domaći */}
        {homework.length > 0 && (
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium inline-flex items-center gap-2">
                <ClipboardList className="size-3.5" strokeWidth={1.75} />
                Domaći zadaci
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {homework.map((h) => (
                <li key={h.id} className="px-5 py-3">
                  <Link
                    href={`/h/${h.public_token}`}
                    target="_blank"
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{h.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {h.due_date
                          ? `Rok: ${format(new Date(h.due_date), "d. MMM yyyy.", { locale: srLatn })}`
                          : `Zadat: ${format(new Date(h.created_at), "d. MMM yyyy.", { locale: srLatn })}`}
                      </p>
                    </div>
                    <StatusBadge status={h.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-[11px] text-muted-foreground text-center pt-4">
          Ovaj portal je privatan. Link je vezan za vaše dete — ne deli ga sa
          drugima.
        </p>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  accent?: "warn" | "ok";
}) {
  const valueColor =
    accent === "warn" ? "text-[#a00]" : accent === "ok" ? "text-foreground" : "";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.75} />
        <span className="text-[11px]">{label}</span>
      </div>
      <div className={`text-lg font-medium mt-1 tabular-nums ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "submitted"
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : status === "graded"
        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
        : "bg-secondary text-foreground border-border";
  const label =
    status === "submitted"
      ? "Predato"
      : status === "graded"
        ? "Ocenjeno"
        : status === "skipped"
          ? "Preskočeno"
          : "Zadato";
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${tone}`}
    >
      {label}
    </span>
  );
}
