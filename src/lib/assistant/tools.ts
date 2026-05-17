/**
 * Tool definicije za AI asistenta.
 *
 * Svaki tool ima:
 *   - JSON schema (Anthropic format) — model vidi šta može da pozove
 *   - Server-side handler — izvršava se kad model pozove tool
 *
 * Read-only alati (auto-izvršenje):
 *   - find_student
 *   - get_student_summary
 *   - get_lesson_history
 *   - get_billing
 *   - get_upcoming_lessons
 *   - find_lessons_in_window
 *   - list_active_students
 *   - navigate_to
 *
 * Write alati (vraćaju proposal — frontend mora da konfirmiše):
 *   - propose_create_lesson
 *   - propose_mark_payment
 *   - propose_reschedule_lesson
 *   - propose_cancel_lesson
 *   - propose_add_homework
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseISO, isValid, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { srLatn } from "date-fns/locale";

const TZ = "Europe/Belgrade";

/** Format datuma u Beogradskoj zoni — uvek koristi za prikaz korisniku. */
function fmt(date: Date | string, pattern: string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TZ, pattern, { locale: srLatn });
}

export type ToolDef = Anthropic.Tool;

export const TOOLS: ToolDef[] = [
  // ======= READ-ONLY =======
  {
    name: "find_student",
    description:
      "Pronađi učenika po imenu (fuzzy match). Vraća listu mogućih kandidata sa id, full_name, grade, parent_name. Koristi pre svega ostalog ako je u poruci pomenuto ime.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Ime ili deo imena učenika.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_student_summary",
    description:
      "Vraća osnovne info o učeniku: razred, default cena, default trajanje, kontakt roditelja, status pretplate izveštaja.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string", description: "UUID učenika." },
      },
      required: ["student_id"],
    },
  },
  {
    name: "get_lesson_history",
    description:
      "Vraća poslednje časove učenika sa beleskama. Default zadnjih 30 dana, max 60.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string" },
        days_back: {
          type: "number",
          description: "Koliko dana unazad (default 30).",
        },
      },
      required: ["student_id"],
    },
  },
  {
    name: "get_billing",
    description:
      "Vraća stanje naplate za učenika: dug, ukupno plaćeno, neplaćeni časovi, poslednje uplate.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string" },
      },
      required: ["student_id"],
    },
  },
  {
    name: "get_upcoming_lessons",
    description:
      "Vraća predstojeće časove. Ako se da student_id, samo za njega; inače za sve učenike.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string" },
        days_ahead: { type: "number", description: "Default 14." },
      },
    },
  },
  {
    name: "find_lessons_in_window",
    description:
      "Vraća časove koji preklapaju zadati vremenski prozor. Koristi se za conflict detection pre kreiranja novog časa.",
    input_schema: {
      type: "object",
      properties: {
        start_iso: { type: "string", description: "ISO timestamp početka." },
        duration_minutes: { type: "number", description: "Trajanje u minutima." },
      },
      required: ["start_iso", "duration_minutes"],
    },
  },
  {
    name: "list_active_students",
    description:
      "Vraća sve aktivne učenike (ime + id). Koristi kad korisnik traži pregled svih.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_debtors",
    description:
      "Vraća učenike koji duguju, sortirano po visini duga DESC. Efikasnije od pozivanja get_billing po učeniku — koristi kad korisnik pita 'ko mi duguje', 'svi sa dugom preko X' i sl.",
    input_schema: {
      type: "object",
      properties: {
        min_debt_para: {
          type: "number",
          description: "Filter: vrati samo one sa dugom većim od ovog (default 0).",
        },
      },
    },
  },
  {
    name: "get_student_curriculum_progress",
    description:
      "Vraća napredak učenika po dodeljenim kurikulumima: ukupan procenat, brojači savladano/u toku/nije počeo, naslovi onoga što je trenutno u toku i sledeća tri zadatka koje treba da se urade. Koristi kad korisnik pita 'gde je Marko sa gradivom', 'šta je sledeće za Anu', 'koliko je savladao u maju' i sl.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string", description: "UUID učenika." },
      },
      required: ["student_id"],
    },
  },
  {
    name: "navigate_to",
    description:
      "Šalje frontend-u zahtev da preusmeri profesora na drugu stranicu app-a. Path mora biti relativan (npr. '/students/abc-123' ili '/schedule').",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        reason: {
          type: "string",
          description: "Kratko objašnjenje zašto navigiramo (model ovo govori korisniku).",
        },
      },
      required: ["path"],
    },
  },

  // ======= PROPOSALS (write — zahtevaju konfirmaciju) =======
  {
    name: "propose_create_lesson",
    description:
      "PREDLAŽE kreiranje novog časa. Vraća proposal — frontend će tražiti potvrdu od korisnika pre nego što stvarno napravi čas. Pre poziva, konfliktiraj sa find_lessons_in_window.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string" },
        scheduled_at_iso: {
          type: "string",
          description: "ISO timestamp početka časa. Mora biti u budućnosti.",
        },
        duration_minutes: { type: "number" },
        price_para: {
          type: "number",
          description:
            "Cena u parama (1500 RSD = 150000 para). Ako nije specifikovano, koristi default sa profila učenika — pošalji 0 da naznačiš default.",
        },
      },
      required: ["student_id", "scheduled_at_iso", "duration_minutes", "price_para"],
    },
  },
  {
    name: "propose_mark_payment",
    description: "PREDLAŽE upisivanje uplate. Frontend će tražiti potvrdu.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string" },
        amount_para: {
          type: "number",
          description: "Iznos u parama.",
        },
        paid_at_iso: {
          type: "string",
          description: "ISO datum uplate. Default danas.",
        },
        method: {
          type: "string",
          enum: ["cash", "transfer", "other"],
          description: "Način plaćanja. Default 'cash'.",
        },
        note: { type: "string" },
      },
      required: ["student_id", "amount_para"],
    },
  },
  {
    name: "propose_reschedule_lesson",
    description: "PREDLAŽE pomeranje termina postojećeg časa.",
    input_schema: {
      type: "object",
      properties: {
        lesson_id: { type: "string" },
        new_scheduled_at_iso: { type: "string" },
      },
      required: ["lesson_id", "new_scheduled_at_iso"],
    },
  },
  {
    name: "propose_cancel_lesson",
    description: "PREDLAŽE otkazivanje časa.",
    input_schema: {
      type: "object",
      properties: {
        lesson_id: { type: "string" },
        reason: {
          type: "string",
          enum: ["cancelled_by_student", "cancelled_by_teacher", "no_show"],
        },
      },
      required: ["lesson_id", "reason"],
    },
  },
  {
    name: "propose_add_homework",
    description: "PREDLAŽE zadavanje domaćeg za učenika.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        due_date: {
          type: "string",
          description: "YYYY-MM-DD format. Opciono.",
        },
        lesson_id: {
          type: "string",
          description: "Veži za konkretan čas (opciono).",
        },
      },
      required: ["student_id", "title"],
    },
  },
];

// =====================================================================
// EXECUTORS — server-side implementacija svakog tool-a
// =====================================================================

export type ProposalAction =
  | { type: "create_lesson"; params: Record<string, unknown> }
  | { type: "mark_payment"; params: Record<string, unknown> }
  | { type: "reschedule_lesson"; params: Record<string, unknown> }
  | { type: "cancel_lesson"; params: Record<string, unknown> }
  | { type: "add_homework"; params: Record<string, unknown> };

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export async function executeTool(
  supabase: SupabaseClient,
  organizationId: string,
  toolName: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "find_student":
        return await findStudent(supabase, organizationId, String(input.query ?? ""));

      case "get_student_summary":
        return await getStudentSummary(supabase, String(input.student_id ?? ""));

      case "get_lesson_history":
        return await getLessonHistory(
          supabase,
          String(input.student_id ?? ""),
          typeof input.days_back === "number" ? input.days_back : 30,
        );

      case "get_billing":
        return await getBilling(supabase, String(input.student_id ?? ""));

      case "get_upcoming_lessons":
        return await getUpcomingLessons(
          supabase,
          input.student_id ? String(input.student_id) : undefined,
          typeof input.days_ahead === "number" ? input.days_ahead : 14,
        );

      case "find_lessons_in_window":
        return await findLessonsInWindow(
          supabase,
          String(input.start_iso ?? ""),
          typeof input.duration_minutes === "number" ? input.duration_minutes : 60,
        );

      case "list_active_students":
        return await listActiveStudents(supabase);

      case "list_debtors":
        return await listDebtors(
          supabase,
          organizationId,
          typeof input.min_debt_para === "number" ? input.min_debt_para : 0,
        );

      case "get_student_curriculum_progress":
        return await getStudentCurriculumProgress(
          supabase,
          String(input.student_id ?? ""),
        );

      case "navigate_to":
        return {
          ok: true,
          data: {
            navigation: {
              path: String(input.path ?? ""),
              reason: String(input.reason ?? ""),
            },
          },
        };

      // PROPOSALS — vraćamo proposal payload, NE izvršavamo akciju.
      // Frontend će prikazati confirmation card.
      case "propose_create_lesson":
        return await prepareCreateLessonProposal(supabase, input);
      case "propose_mark_payment":
        return await preparePaymentProposal(supabase, input);
      case "propose_reschedule_lesson":
        return await prepareRescheduleProposal(supabase, input);
      case "propose_cancel_lesson":
        return await prepareCancelProposal(supabase, input);
      case "propose_add_homework":
        return await prepareHomeworkProposal(supabase, input);

      default:
        return { ok: false, error: `Nepoznat tool: ${toolName}` };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Tool error",
    };
  }
}

// =====================================================================
// IMPLEMENTACIJE READ TOOL-OVA
// =====================================================================

async function getStudentCurriculumProgress(
  supabase: SupabaseClient,
  studentId: string,
): Promise<ToolResult> {
  if (!studentId) return { ok: false, error: "Nedostaje student_id." };

  const { getStudentPlan } = await import("@/lib/curriculum/queries");
  const plan = await getStudentPlan(supabase, studentId);

  if (plan.active.length === 0) {
    return {
      ok: true,
      data: {
        active_curricula: 0,
        message: "Učenik nema aktivnih kurikuluma. Dodeli mu jedan u Plan tabu.",
      },
    };
  }

  const summary = plan.active.map((a) => {
    // Leaves: subtopics + sections without children.
    const leaves = a.units.filter(
      (u) =>
        u.parent_unit_id !== null ||
        !a.units.some((c) => c.parent_unit_id === u.id),
    );
    const progressByUnit = new Map(a.progress.map((p) => [p.unit_id, p]));
    let mastered = 0;
    let inProgress = 0;
    let notStarted = 0;
    let skipped = 0;
    const inProgressTitles: string[] = [];
    const recentlyMastered: { title: string; mastered_at: string }[] = [];

    for (const u of leaves) {
      const p = progressByUnit.get(u.id);
      const status = p?.status ?? "not_started";
      if (status === "mastered") {
        mastered++;
        if (p?.mastered_at) {
          recentlyMastered.push({
            title: u.title,
            mastered_at: p.mastered_at,
          });
        }
      } else if (status === "in_progress") {
        inProgress++;
        inProgressTitles.push(u.title);
      } else if (status === "skipped") {
        skipped++;
      } else {
        notStarted++;
      }
    }

    // Next 3 not-started units in order: walk units in (parent_order, order_index).
    const sectionsById = new Map(
      a.units.filter((u) => u.parent_unit_id === null).map((s) => [s.id, s]),
    );
    const orderedLeaves = [...leaves].sort((x, y) => {
      const xSec = x.parent_unit_id
        ? (sectionsById.get(x.parent_unit_id)?.order_index ?? 0)
        : x.order_index;
      const ySec = y.parent_unit_id
        ? (sectionsById.get(y.parent_unit_id)?.order_index ?? 0)
        : y.order_index;
      if (xSec !== ySec) return xSec - ySec;
      return x.order_index - y.order_index;
    });
    const nextUp: string[] = [];
    for (const u of orderedLeaves) {
      const status = progressByUnit.get(u.id)?.status ?? "not_started";
      if (status === "not_started" && nextUp.length < 3) nextUp.push(u.title);
    }

    recentlyMastered.sort((x, y) =>
      x.mastered_at < y.mastered_at ? 1 : -1,
    );

    const total = leaves.length;
    const pct = total === 0 ? 0 : Math.round((mastered / total) * 100);

    return {
      curriculum: {
        name: a.curriculum.name,
        subject: a.curriculum.subject,
        grade: a.curriculum.grade_label,
      },
      progress_pct: pct,
      counts: {
        total,
        mastered,
        in_progress: inProgress,
        not_started: notStarted,
        skipped,
      },
      in_progress_titles: inProgressTitles,
      next_up: nextUp,
      recently_mastered: recentlyMastered.slice(0, 5).map((r) => ({
        title: r.title,
        mastered_at: fmt(r.mastered_at, "d. MMM yyyy"),
      })),
    };
  });

  return { ok: true, data: { active_curricula: summary.length, curricula: summary } };
}

async function findStudent(
  supabase: SupabaseClient,
  orgId: string,
  query: string,
): Promise<ToolResult> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: false, error: "Query je prazan." };

  const { data } = await supabase
    .from("students")
    .select("id, full_name, grade, parent_name, status")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .ilike("full_name", `%${trimmed}%`)
    .limit(8);

  return {
    ok: true,
    data: {
      query: trimmed,
      matches: (data ?? []).map((s) => ({
        id: s.id,
        full_name: s.full_name,
        grade: s.grade,
        parent_name: s.parent_name,
        status: s.status,
      })),
    },
  };
}

async function getStudentSummary(
  supabase: SupabaseClient,
  studentId: string,
): Promise<ToolResult> {
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return { ok: false, error: "Učenik nije pronađen." };

  return {
    ok: true,
    data: {
      id: data.id,
      full_name: data.full_name,
      grade: data.grade,
      school: data.school,
      parent_name: data.parent_name,
      parent_phone: data.parent_phone,
      parent_email: data.parent_email,
      default_price_per_lesson: data.default_price_per_lesson,
      default_lesson_duration_minutes: data.default_lesson_duration_minutes,
      status: data.status,
      report_audience: data.report_audience,
      weekly_reports_enabled: data.weekly_reports_enabled,
      monthly_reports_enabled: data.monthly_reports_enabled,
    },
  };
}

async function getLessonHistory(
  supabase: SupabaseClient,
  studentId: string,
  daysBack: number,
): Promise<ToolResult> {
  const since = subDays(new Date(), Math.min(daysBack, 90));
  const { data } = await supabase
    .from("lessons")
    .select(
      "id, scheduled_at, duration_minutes, status, lesson_rating, topics_covered, progress_summary, next_lesson_plan",
    )
    .eq("student_id", studentId)
    .is("deleted_at", null)
    .gte("scheduled_at", since.toISOString())
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: false })
    .limit(40);

  return {
    ok: true,
    data: {
      student_id: studentId,
      days_back: daysBack,
      lessons: (data ?? []).map((l) => ({
        id: l.id,
        date: fmt(l.scheduled_at, "EEE d. MMM yyyy. HH:mm"),
        duration_min: l.duration_minutes,
        status: l.status,
        rating: l.lesson_rating,
        topics: l.topics_covered,
        progress: l.progress_summary,
        next_plan: l.next_lesson_plan,
      })),
    },
  };
}

async function getBilling(
  supabase: SupabaseClient,
  studentId: string,
): Promise<ToolResult> {
  const [{ data: lessonsData }, { data: paymentsData }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, scheduled_at, status, price")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .lte("scheduled_at", new Date().toISOString()),
    supabase
      .from("payments")
      .select("id, amount, paid_at, method")
      .eq("student_id", studentId)
      .order("paid_at", { ascending: false })
      .limit(15),
  ]);

  const billable = (lessonsData ?? []).filter((l) =>
    ["completed", "no_show", "cancelled_by_student"].includes(l.status as string),
  );
  const totalBillable = billable.reduce((s, l) => s + l.price, 0);
  const totalPaid = (paymentsData ?? []).reduce(
    (s: number, p: { amount: number }) => s + p.amount,
    0,
  );

  return {
    ok: true,
    data: {
      student_id: studentId,
      total_billable_para: totalBillable,
      total_paid_para: totalPaid,
      debt_para: totalBillable - totalPaid,
      recent_payments: (paymentsData ?? []).slice(0, 8).map((p) => ({
        id: p.id,
        amount_para: p.amount,
        paid_at: p.paid_at,
        method: p.method,
      })),
    },
  };
}

async function getUpcomingLessons(
  supabase: SupabaseClient,
  studentId: string | undefined,
  daysAhead: number,
): Promise<ToolResult> {
  const until = new Date();
  until.setDate(until.getDate() + Math.min(daysAhead, 60));

  let q = supabase
    .from("lessons")
    .select("id, scheduled_at, duration_minutes, status, students(full_name)")
    .is("deleted_at", null)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .lte("scheduled_at", until.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (studentId) q = q.eq("student_id", studentId);

  const { data } = await q;

  return {
    ok: true,
    data: {
      lessons: ((data ?? []) as unknown as Array<{
        id: string;
        scheduled_at: string;
        duration_minutes: number;
        status: string;
        students: { full_name: string } | null;
      }>).map((l) => ({
        id: l.id,
        student_name: l.students?.full_name,
        date: fmt(l.scheduled_at, "EEE d. MMM HH:mm"),
        scheduled_at: l.scheduled_at,
        duration_min: l.duration_minutes,
      })),
    },
  };
}

async function findLessonsInWindow(
  supabase: SupabaseClient,
  startIso: string,
  durationMinutes: number,
): Promise<ToolResult> {
  const start = parseISO(startIso);
  if (!isValid(start)) return { ok: false, error: "start_iso nije validan." };
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  // Pull širi window pa filtriraj precizno
  const windowStart = new Date(start.getTime() - 12 * 3600_000);
  const windowEnd = new Date(end.getTime() + 12 * 3600_000);

  const { data } = await supabase
    .from("lessons")
    .select("id, scheduled_at, duration_minutes, status, students(full_name)")
    .is("deleted_at", null)
    .eq("status", "scheduled")
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  const conflicts = ((data ?? []) as unknown as Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    students: { full_name: string } | null;
  }>).filter((l) => {
    const lStart = new Date(l.scheduled_at);
    const lEnd = new Date(lStart.getTime() + l.duration_minutes * 60_000);
    return lStart < end && lEnd > start;
  });

  return {
    ok: true,
    data: {
      start_iso: startIso,
      duration_minutes: durationMinutes,
      conflicts: conflicts.map((c) => ({
        id: c.id,
        student_name: c.students?.full_name,
        date: fmt(c.scheduled_at, "EEE d. MMM HH:mm"),
        duration_min: c.duration_minutes,
      })),
    },
  };
}

async function listDebtors(
  supabase: SupabaseClient,
  orgId: string,
  minDebtPara: number,
): Promise<ToolResult> {
  // Pull sve aktivne učenike + njihovi billable lessons + payments u jednom roundtrip-u
  const [studentsRes, lessonsRes, paymentsRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, grade, parent_phone")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .eq("status", "active"),
    supabase
      .from("lessons")
      .select("student_id, status, price")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .lte("scheduled_at", new Date().toISOString())
      .in("status", ["completed", "no_show", "cancelled_by_student"]),
    supabase
      .from("payments")
      .select("student_id, amount")
      .eq("organization_id", orgId),
  ]);

  const lessons = (lessonsRes.data ?? []) as Array<{
    student_id: string;
    price: number;
  }>;
  const payments = (paymentsRes.data ?? []) as Array<{
    student_id: string;
    amount: number;
  }>;
  const students = (studentsRes.data ?? []) as Array<{
    id: string;
    full_name: string;
    grade: string | null;
    parent_phone: string | null;
  }>;

  const billableByStudent = new Map<string, number>();
  for (const l of lessons) {
    billableByStudent.set(
      l.student_id,
      (billableByStudent.get(l.student_id) ?? 0) + l.price,
    );
  }
  const paidByStudent = new Map<string, number>();
  for (const p of payments) {
    paidByStudent.set(
      p.student_id,
      (paidByStudent.get(p.student_id) ?? 0) + p.amount,
    );
  }

  const debtors = students
    .map((s) => {
      const billable = billableByStudent.get(s.id) ?? 0;
      const paid = paidByStudent.get(s.id) ?? 0;
      return {
        id: s.id,
        full_name: s.full_name,
        grade: s.grade,
        parent_phone: s.parent_phone,
        debt_para: billable - paid,
      };
    })
    .filter((d) => d.debt_para > minDebtPara)
    .sort((a, b) => b.debt_para - a.debt_para);

  return {
    ok: true,
    data: {
      min_debt_para: minDebtPara,
      total_debtors: debtors.length,
      total_debt_para: debtors.reduce((s, d) => s + d.debt_para, 0),
      debtors,
    },
  };
}

async function listActiveStudents(
  supabase: SupabaseClient,
): Promise<ToolResult> {
  const { data } = await supabase
    .from("students")
    .select("id, full_name, grade, default_price_per_lesson")
    .is("deleted_at", null)
    .eq("status", "active")
    .order("full_name");

  return { ok: true, data: { students: data ?? [] } };
}

// =====================================================================
// PROPOSAL PREPARATIONS — ne mutiraju, samo formatiraju za frontend
// =====================================================================

async function prepareCreateLessonProposal(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const studentId = String(input.student_id ?? "");
  const scheduledAt = String(input.scheduled_at_iso ?? "");
  const durationMin = Number(input.duration_minutes);
  let pricePara = Number(input.price_para);

  const { data: student } = await supabase
    .from("students")
    .select("full_name, default_price_per_lesson, default_lesson_duration_minutes")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return { ok: false, error: "Učenik nije pronađen." };

  if (!pricePara || pricePara === 0) {
    pricePara = student.default_price_per_lesson ?? 0;
  }

  return {
    ok: true,
    data: {
      proposal: {
        type: "create_lesson",
        params: {
          student_id: studentId,
          scheduled_at_iso: scheduledAt,
          duration_minutes: durationMin,
          price_para: pricePara,
        },
        summary: {
          student_name: student.full_name,
          when: fmt(scheduledAt, "EEE d. MMM yyyy. 'u' HH:mm"),
          duration_min: durationMin,
          price_rsd: pricePara / 100,
        },
      },
    },
  };
}

async function preparePaymentProposal(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const studentId = String(input.student_id ?? "");
  const amountPara = Number(input.amount_para);
  const paidAtIso = String(input.paid_at_iso ?? new Date().toISOString());
  const method = String(input.method ?? "cash");
  const note = input.note ? String(input.note) : null;

  const { data: student } = await supabase
    .from("students")
    .select("full_name")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return { ok: false, error: "Učenik nije pronađen." };

  return {
    ok: true,
    data: {
      proposal: {
        type: "mark_payment",
        params: {
          student_id: studentId,
          amount_para: amountPara,
          paid_at_iso: paidAtIso,
          method,
          note,
        },
        summary: {
          student_name: student.full_name,
          amount_rsd: amountPara / 100,
          when: fmt(paidAtIso, "d. MMM yyyy."),
          method,
          note,
        },
      },
    },
  };
}

async function prepareRescheduleProposal(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const lessonId = String(input.lesson_id ?? "");
  const newAt = String(input.new_scheduled_at_iso ?? "");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("scheduled_at, students(full_name)")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return { ok: false, error: "Čas nije pronađen." };

  const lessonAny = lesson as unknown as {
    scheduled_at: string;
    students: { full_name: string } | null;
  };

  return {
    ok: true,
    data: {
      proposal: {
        type: "reschedule_lesson",
        params: { lesson_id: lessonId, new_scheduled_at_iso: newAt },
        summary: {
          student_name: lessonAny.students?.full_name,
          old_when: fmt(lessonAny.scheduled_at, "EEE d. MMM HH:mm"),
          new_when: fmt(newAt, "EEE d. MMM HH:mm"),
        },
      },
    },
  };
}

async function prepareCancelProposal(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const lessonId = String(input.lesson_id ?? "");
  const reason = String(input.reason ?? "cancelled_by_student");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("scheduled_at, students(full_name)")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return { ok: false, error: "Čas nije pronađen." };

  const lessonAny = lesson as unknown as {
    scheduled_at: string;
    students: { full_name: string } | null;
  };

  return {
    ok: true,
    data: {
      proposal: {
        type: "cancel_lesson",
        params: { lesson_id: lessonId, reason },
        summary: {
          student_name: lessonAny.students?.full_name,
          when: fmt(lessonAny.scheduled_at, "EEE d. MMM HH:mm"),
          reason_label:
            reason === "no_show"
              ? "nije se pojavio"
              : reason === "cancelled_by_teacher"
                ? "otkazao profesor"
                : "otkazao učenik",
        },
      },
    },
  };
}

async function prepareHomeworkProposal(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const studentId = String(input.student_id ?? "");
  const title = String(input.title ?? "");
  const description = input.description ? String(input.description) : null;
  const dueDate = input.due_date ? String(input.due_date) : null;
  const lessonId = input.lesson_id ? String(input.lesson_id) : null;

  const { data: student } = await supabase
    .from("students")
    .select("full_name")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return { ok: false, error: "Učenik nije pronađen." };

  return {
    ok: true,
    data: {
      proposal: {
        type: "add_homework",
        params: {
          student_id: studentId,
          title,
          description,
          due_date: dueDate,
          lesson_id: lessonId,
        },
        summary: {
          student_name: student.full_name,
          title,
          description,
          due_date: dueDate,
        },
      },
    },
  };
}
