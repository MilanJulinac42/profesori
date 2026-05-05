import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Calendar, AlertCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getReportLog } from "@/lib/reports/queries";
import { REPORT_KIND_LABELS } from "@/lib/reports/types";

export default async function ReportSnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const log = await getReportLog(supabase, id);

  if (!log) notFound();

  // Pokušaj da nađemo studentId za nazad-link.
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("id", log.student_id)
    .maybeSingle();

  const sentDt = new Date(log.sent_at);

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
      <Link
        href={student ? `/students/${student.id}` : "/students"}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        {student ? `Nazad na ${student.full_name}` : "Nazad"}
      </Link>

      <header className="space-y-2 pb-4 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-medium tracking-tight">
            {REPORT_KIND_LABELS[log.kind]}
          </h1>
          <StatusBadge status={log.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3" strokeWidth={1.75} />
            Poslato{" "}
            {sentDt.toLocaleDateString("sr-Latn-RS", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {", "}
            {sentDt.toLocaleTimeString("sr-Latn-RS", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail className="size-3" strokeWidth={1.75} />
            {log.recipient_email}
          </span>
          <span>·</span>
          <span>
            Period {log.period_start} → {log.period_end}
          </span>
        </div>
        {log.status === "failed" && log.error_message && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="size-4 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-medium">Slanje nije uspelo</p>
              <p className="text-xs mt-1">{log.error_message}</p>
            </div>
          </div>
        )}
      </header>

      <div className="rounded-xl border border-border overflow-hidden bg-[#f6f6f4]">
        <iframe
          title="Snapshot izveštaja"
          srcDoc={log.html_body}
          sandbox=""
          className="w-full h-[80vh] border-0 bg-white"
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "sent") {
    return (
      <Badge variant="outline" className="font-normal gap-1">
        <Check className="size-3" strokeWidth={2.5} />
        Poslato
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="font-normal gap-1 border-destructive/40 text-destructive"
      >
        <AlertCircle className="size-3" strokeWidth={2} />
        Greška
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal">
      Preview
    </Badge>
  );
}
