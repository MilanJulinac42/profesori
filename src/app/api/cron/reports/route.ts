import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReport } from "@/lib/reports/generate";
import { sendReport } from "@/lib/reports/send";
import { getPastReportPeriod } from "@/lib/reports/period";
import type { ReportKind } from "@/lib/reports/types";
import type { Student } from "@/lib/students/types";

// Cron može da radi do 5 min na Vercel Pro; na Hobby tier 60s.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reports?kind=weekly|monthly
 *
 * Vercel cron pogađa ovaj endpoint po šemi iz vercel.json. Auth je
 * `Authorization: Bearer <CRON_SECRET>` (Vercel dodaje header automatski).
 *
 * Logika:
 * 1. Validira kind i secret
 * 2. Computeuje "prošli period" (npr. ako se izvršava u ponedeljak ujutru,
 *    šalje izveštaj za prošlu nedelju Pon-Ned)
 * 3. Iterira sve org-ove → sve aktivne učenike sa odgovarajućim flagom
 * 4. Skipuje učenike za koje već postoji log za taj period (idempotency)
 * 5. Skipuje učenike bez email-a za odabranu publiku
 * 6. Generiše + šalje izveštaj per učenik; greška za jednog ne zaustavlja
 *    ostale.
 *
 * Vraća JSON sa summary statistikom za Vercel logs.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET nije podešen u env." },
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as ReportKind | null;
  if (kind !== "weekly" && kind !== "monthly") {
    return NextResponse.json(
      { error: "Nedostaje validan kind (weekly|monthly)" },
      { status: 400 },
    );
  }

  const startTime = Date.now();
  const supabase = createAdminClient();
  const period = getPastReportPeriod(kind);
  const periodStartIso = period.start.toISOString().slice(0, 10);

  const stats = {
    kind,
    period_start: periodStartIso,
    period_end: period.end.toISOString().slice(0, 10),
    orgs_processed: 0,
    students_total: 0,
    sent: 0,
    skipped_already_sent: 0,
    skipped_no_email: 0,
    failed: 0,
    failures: [] as { studentId: string; error: string }[],
  };

  // Pull sve org-ove (i njihovog vlasnika za teacherName).
  const { data: orgs, error: orgsErr } = await supabase
    .from("organizations")
    .select("id, name, users(full_name, role)")
    .is("deleted_at", null);

  if (orgsErr) {
    return NextResponse.json(
      { error: `Greška pri čitanju org-ova: ${orgsErr.message}` },
      { status: 500 },
    );
  }

  const flagColumn =
    kind === "weekly" ? "weekly_reports_enabled" : "monthly_reports_enabled";

  for (const org of orgs ?? []) {
    stats.orgs_processed += 1;
    const teacherName = pickOwnerName(org.users) ?? "Profesor";

    const { data: studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("organization_id", org.id)
      .eq("status", "active")
      .eq(flagColumn, true)
      .is("deleted_at", null);

    const students = (studentsData as Student[] | null) ?? [];
    if (students.length === 0) continue;

    // Pre-check: koji učenici već imaju 'sent' log za ovaj period?
    const studentIds = students.map((s) => s.id);
    const { data: existingLogs } = await supabase
      .from("report_logs")
      .select("student_id")
      .in("student_id", studentIds)
      .eq("kind", kind)
      .eq("period_start", periodStartIso)
      .eq("status", "sent");

    const alreadySent = new Set(
      (existingLogs ?? []).map((l) => l.student_id as string),
    );

    for (const student of students) {
      stats.students_total += 1;

      if (alreadySent.has(student.id)) {
        stats.skipped_already_sent += 1;
        continue;
      }

      const recipient =
        student.report_audience === "parent"
          ? student.parent_email
          : student.student_email;
      if (!recipient || !recipient.trim()) {
        stats.skipped_no_email += 1;
        continue;
      }

      try {
        await sendStudentReport(supabase, student, kind, teacherName);
        stats.sent += 1;
      } catch (err) {
        stats.failed += 1;
        stats.failures.push({
          studentId: student.id,
          error: err instanceof Error ? err.message : "Nepoznata greška",
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;
  return NextResponse.json({ ok: true, durationMs, ...stats });
}

async function sendStudentReport(
  supabase: SupabaseClient,
  student: Student,
  kind: ReportKind,
  teacherName: string,
): Promise<void> {
  const period = getPastReportPeriod(kind);
  const data = await generateReport(supabase, {
    kind,
    student,
    teacherName,
    anchor: period.start,
  });

  const outcome = await sendReport(supabase, data, student);
  if (!outcome.ok) {
    throw new Error(outcome.error);
  }
}

function pickOwnerName(users: unknown): string | null {
  // Supabase može vratiti niz ili jedan objekat zavisno od join shape-a.
  if (Array.isArray(users)) {
    const owner = users.find(
      (u) => (u as { role?: string }).role === "owner",
    );
    return (owner as { full_name?: string | null } | undefined)?.full_name ?? null;
  }
  if (users && typeof users === "object") {
    return (users as { full_name?: string | null }).full_name ?? null;
  }
  return null;
}
