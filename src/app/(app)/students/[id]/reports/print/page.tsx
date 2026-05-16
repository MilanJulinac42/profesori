import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AutoPrint } from "@/components/auto-print";
import type { ReportLog } from "@/lib/reports/types";

type Search = { year?: string };

/**
 * Combined print view — all `sent` reports for a student in a given year,
 * concatenated with page breaks. Lets the teacher hand a parent a single
 * year-end packet ("Marko 2026.") without juggling 12 monthly emails.
 *
 * Each per-report html_body is rendered inline (with extractBodyInner) so
 * styling matches what the parent originally received over email.
 */
export default async function CombinedReportsPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const year = parseYear(sp.year) ?? new Date().getFullYear();

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!student) notFound();

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  const { data: logsData } = await supabase
    .from("report_logs")
    .select("*")
    .eq("student_id", id)
    .eq("status", "sent")
    .gte("period_start", yearStart)
    .lt("period_start", yearEnd)
    .order("period_start", { ascending: true });

  const logs = (logsData as ReportLog[] | null) ?? [];

  if (logs.length === 0) {
    return (
      <div className="bg-white print:bg-white min-h-full p-12 text-center">
        <h1 className="text-2xl font-medium mb-2">
          {student.full_name} · {year}.
        </h1>
        <p className="text-sm text-muted-foreground">
          Nema poslatih izveštaja za ovu godinu.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white print:bg-white min-h-full">
      <AutoPrint />
      <style>{`
        @media print {
          .report-page { page-break-after: always; }
          .report-page:last-child { page-break-after: auto; }
        }
      `}</style>
      <div className="report-page p-12 max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 mb-2">
          Godišnji pregled izveštaja
        </p>
        <h1 className="text-3xl font-medium tracking-tight mb-2 text-neutral-900">
          {student.full_name}
        </h1>
        <p className="text-base text-neutral-600">
          {year}. · {logs.length}{" "}
          {logs.length === 1
            ? "poslat izveštaj"
            : logs.length < 5
              ? "poslata izveštaja"
              : "poslatih izveštaja"}
        </p>
        <ul className="mt-8 space-y-2 text-sm text-neutral-700">
          {logs.map((l, i) => (
            <li
              key={l.id}
              className="flex items-baseline justify-between border-b border-neutral-200 pb-1.5"
            >
              <span>
                {i + 1}. {l.subject}
              </span>
              <span className="text-xs text-neutral-500 tabular-nums">
                {new Date(l.sent_at).toLocaleDateString("sr-Latn-RS", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {logs.map((log) => (
        <div key={log.id} className="report-page">
          <div
            dangerouslySetInnerHTML={{ __html: extractBodyInner(log.html_body) }}
          />
        </div>
      ))}
    </div>
  );
}

function parseYear(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 2000 || n > 2100) return null;
  return Math.round(n);
}

function extractBodyInner(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}
