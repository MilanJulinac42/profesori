import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXERCISE_MODEL, getAnthropic } from "@/lib/ai/anthropic";
import { computeBillableStatuses } from "@/lib/payments/types";
import { getStudentBilling } from "@/lib/payments/queries";
import { getOrgSettings } from "@/lib/settings/queries";
import type { Student, ReportAudience } from "@/lib/students/types";
import { getReportPeriod } from "./period";
import type { LessonInReport, ReportData, ReportKind } from "./types";

const IntroSchema = z.object({
  intro: z
    .string()
    .min(20)
    .max(600)
    .describe(
      "1-2 rečenice koje sažimaju period — šta je glavni tok bio, kako je išlo. Bez floskula, bez emoji-ja.",
    ),
});

const INTRO_SYSTEM_PROMPT = `Ti pišeš uvodni paragraf za izveštaj profesora privatnih časova u Srbiji.

PRAVILA:

1. Maksimalno 1-2 rečenice. Konkretno, ne uopšteno.
2. Piši na srpskom (latinica), profesionalno ali toplo.
3. Lice se određuje publikom:
   - Publika "parent" → 3. lice ("Marko je ove nedelje radio kvadratne jednačine i napreduje sa rastavljanjem.")
   - Publika "student" → 2. lice ("Pokrio si kvadratne jednačine i počinjemo da te ne plaši rastavljanje.")
4. Bez emoji-ja, bez "Drago mi je da javim..." floskula. Direktno na suštinu.
5. Ako je period bio slab (otkazani časovi, niske ocene), budi iskren ali konstruktivan: "Ova nedelja je bila izazovna, ali..."
6. Ako je period bio prazan (0 časova), to NIJE greška — formuliši: "Ove nedelje nije bilo časova" ili sl.
7. Vraćaš isključivo strukturisan JSON sa "intro" poljem.`;

export type GenerateReportInput = {
  kind: ReportKind;
  student: Student;
  teacherName: string;
  /** Default: trenutna nedelja/mesec. */
  anchor?: Date;
};

export async function generateReport(
  supabase: SupabaseClient,
  input: GenerateReportInput,
): Promise<ReportData> {
  const period = getReportPeriod(input.kind, input.anchor);

  // Časovi u periodu.
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select(
      "id, scheduled_at, duration_minutes, status, topics_covered, lesson_rating, progress_summary, next_lesson_plan",
    )
    .eq("student_id", input.student.id)
    .is("deleted_at", null)
    .gte("scheduled_at", period.start.toISOString())
    .lte("scheduled_at", period.end.toISOString())
    .order("scheduled_at", { ascending: true });

  const lessonsRaw =
    (lessonsData as
      | {
          id: string;
          scheduled_at: string;
          duration_minutes: number;
          status: string;
          topics_covered: string[] | null;
          lesson_rating: number | null;
          progress_summary: string | null;
          next_lesson_plan: string | null;
        }[]
      | null) ?? [];

  const lessons: LessonInReport[] = lessonsRaw.map((l) => ({
    id: l.id,
    scheduled_at: l.scheduled_at,
    duration_minutes: l.duration_minutes,
    status: l.status,
    topics: l.topics_covered ?? [],
    rating: l.lesson_rating,
    progress_summary: l.progress_summary,
  }));

  const held = lessonsRaw.filter((l) => l.status === "completed");
  const cancelled = lessonsRaw.filter(
    (l) =>
      l.status === "cancelled_by_student" ||
      l.status === "cancelled_by_teacher" ||
      l.status === "no_show",
  );
  const totalMinutes = held.reduce((sum, l) => sum + l.duration_minutes, 0);

  // Top teme — frequency count, max 8.
  const topicCounts = new Map<string, number>();
  for (const l of held) {
    for (const t of l.topics_covered ?? []) {
      const key = t.trim();
      if (!key) continue;
      topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);
    }
  }
  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);

  // Prosečna ocena (samo iz čaova koji imaju rating).
  const ratings = held
    .map((l) => l.lesson_rating)
    .filter((r): r is number => r !== null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : null;

  // Plan za sledeći put — iz POSLEDNJEG časa koji ima next_lesson_plan.
  const nextLessonPlan =
    [...lessonsRaw]
      .reverse()
      .find((l) => l.next_lesson_plan && l.next_lesson_plan.trim())
      ?.next_lesson_plan?.trim() ?? null;

  // Naplata.
  const settings = await getOrgSettings(supabase, input.student.organization_id);
  const billableStatuses = computeBillableStatuses(settings);
  const billing = await getStudentBilling(
    supabase,
    input.student.id,
    billableStatuses,
  );
  const paidThisPeriod = (billing.payments ?? [])
    .filter((p) => {
      const dt = new Date(p.paid_at);
      return dt >= period.start && dt <= period.end;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // AI uvodni paragraf.
  const ai = await generateIntro({
    audience: input.student.report_audience,
    studentName: input.student.full_name,
    grade: input.student.grade,
    kind: input.kind,
    periodLabel: period.label,
    lessonsHeld: held.length,
    lessonsCancelled: cancelled.length,
    topTopics,
    avgRating,
    progressSnippets: held
      .map((l) => l.progress_summary)
      .filter((s): s is string => !!s && s.trim().length > 0),
  });

  return {
    kind: input.kind,
    audience: input.student.report_audience,
    studentName: input.student.full_name,
    studentGrade: input.student.grade,
    parentName: input.student.parent_name,
    teacherName: input.teacherName,
    periodStart: period.start,
    periodEnd: period.end,
    periodLabel: period.label,
    lessonsHeld: held.length,
    lessonsCancelled: cancelled.length,
    totalMinutes,
    topTopics,
    avgRating,
    lessons,
    nextLessonPlan,
    paidThisPeriod,
    totalDebtNow: billing.debt,
    aiIntro: ai.intro,
    aiInputTokens: ai.inputTokens,
    aiOutputTokens: ai.outputTokens,
  };
}

type IntroInput = {
  audience: ReportAudience;
  studentName: string;
  grade: string | null;
  kind: ReportKind;
  periodLabel: string;
  lessonsHeld: number;
  lessonsCancelled: number;
  topTopics: string[];
  avgRating: number | null;
  progressSnippets: string[];
};

async function generateIntro(input: IntroInput): Promise<{
  intro: string;
  inputTokens: number;
  outputTokens: number;
}> {
  // Ako nema podataka uopšte, ne troši AI poziv — vrati statičan tekst.
  if (input.lessonsHeld === 0 && input.lessonsCancelled === 0) {
    const intro =
      input.audience === "student"
        ? `${input.kind === "weekly" ? "Ove nedelje" : "Ovog meseca"} nije bilo časova.`
        : `${input.kind === "weekly" ? "Ove nedelje" : "Ovog meseca"} nije bilo časova sa ${input.studentName}.`;
    return { intro, inputTokens: 0, outputTokens: 0 };
  }

  const userPrompt = buildIntroPrompt(input);

  const client = getAnthropic();
  const response = await client.messages.parse({
    model: EXERCISE_MODEL,
    max_tokens: 400,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(IntroSchema),
    },
    system: [
      {
        type: "text",
        text: INTRO_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!response.parsed_output) {
    return {
      intro:
        input.audience === "student"
          ? "Period je iza nas — pogledaj rezime ispod."
          : `Period za ${input.studentName} je iza nas — rezime ispod.`,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }

  return {
    intro: response.parsed_output.intro,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

function buildIntroPrompt(input: IntroInput): string {
  const parts = [
    `PUBLIKA: ${input.audience} (${input.audience === "parent" ? "piši u 3. licu" : "piši u 2. licu"})`,
    `UČENIK: ${input.studentName}${input.grade ? ` (${input.grade})` : ""}`,
    `PERIOD: ${input.kind === "weekly" ? "nedeljni" : "mesečni"} izveštaj — ${input.periodLabel}`,
    ``,
    `STATISTIKA:`,
    `- Održanih časova: ${input.lessonsHeld}`,
    `- Otkazanih / no-show: ${input.lessonsCancelled}`,
  ];
  if (input.topTopics.length > 0) {
    parts.push(`- Pokrivene teme: ${input.topTopics.join(", ")}`);
  }
  if (input.avgRating !== null) {
    parts.push(`- Prosečna ocena časa: ${input.avgRating.toFixed(1)} / 5`);
  }

  if (input.progressSnippets.length > 0) {
    parts.push(``, `BELEŠKE PROFESORA PO ČASOVIMA:`);
    for (const s of input.progressSnippets.slice(0, 12)) {
      parts.push(`- ${s}`);
    }
  }

  parts.push(
    ``,
    `Napiši 1-2 rečenice uvodnog rezimea u skladu sa pravilima.`,
  );
  return parts.join("\n");
}
