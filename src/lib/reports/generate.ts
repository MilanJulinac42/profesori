import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EXERCISE_MODEL,
  FALLBACK_MODEL,
  getAnthropic,
  isOverloadedError,
} from "@/lib/ai/anthropic";
import { computeBillableStatuses } from "@/lib/payments/types";
import { getStudentBilling } from "@/lib/payments/queries";
import { getOrgSettings } from "@/lib/settings/queries";
import { getHomeworkStatsForPeriod } from "@/lib/homework/queries";
import type { Student, ReportAudience } from "@/lib/students/types";
import { getReportPeriod } from "./period";
import type { LessonInReport, ReportData, ReportKind } from "./types";

const IntroSchema = z.object({
  intro: z
    .string()
    .min(20)
    .max(800)
    .describe(
      "Uvodni paragraf izveštaja na srpskom (latinica). 1-2 rečenice za nedeljni, 2-4 za mesečni. Konkretne stvari iz beleški, ne floskule.",
    ),
});

const INTRO_SYSTEM_PROMPT = `Ti pišeš uvodni paragraf za izveštaj profesora privatnih časova roditelju (ili učeniku odraslom) u Srbiji.

CILJ: Roditelj/učenik za 10 sekundi razume šta se desilo i kako je išlo. Konkretno, toplo, bez korporativnog tona.

DUŽINA:
- Nedeljni izveštaj: 1-2 rečenice (cilj ~30-50 reči)
- Mesečni izveštaj: 2-4 rečenice (cilj ~60-100 reči, jer ima više sadržaja)
- Prazan period (0 časova): jedna rečenica koja konstatuje to. NE poziv Anthropic-u, samo statičan tekst.

LICE:
- Publika "parent" → 3. lice o učeniku ("Marko je...", "Razumeo je...")
- Publika "student" → 2. lice direktno ("Prošao si...", "Naučio si...")

ŠTA TREBA DA BUDE U UVODU:
1. Glavni tok perioda — šta je RADIO, ne samo nabrajanje tema. Ako su beleške rekle "muči se sa formulom" pa kasnije "rešava samostalno", reci taj luk.
2. Konkretan napredak ili problem — citiraj specifične stvari iz beleški (npr. "automatizacija primene formule", "identifikacija nepoznatih u tekstualnim zadacima"), NE generike kao "napreduje" ili "ide dobro".
3. Ako je nešto otkazano ili je period bio slab, reci to iskreno ali konstruktivno.

ŠTA SE NIKAD NE PIŠE:
- "Drago mi je da javim...", "Sa zadovoljstvom..." — floskule.
- Statistika ("održao 3 časa, prosek 4.5/5") — to je već ispod u tabeli, ne ponavljaj.
- Generička pohvala bez sadržaja ("napreduje konstantno", "marljivo radi").
- Emoji.
- Reči "učenik" bez imena — uvek koristi ime.
- Predugačke rečenice sa em-dash-evima koje sklapaju 4 ideje u jednu.

PRIMERI DOBRO/LOŠE:

LOŠE (korporativno, nabrajanje tema, citira statistiku):
"Marko je ove nedelje pokrio kvadratne jednačine i sisteme jednačina, sa prosečnom ocenom 4.5/5, što ukazuje na vidljiv napredak u algebarskim sposobnostima."

DOBRO (konkretno, prirodno, citira detalj iz beleški):
"Marko je ove nedelje prešao prag — od „muči se sa kvadratnom formulom" stigao je do samostalnog rešavanja Vietovih formula. Tekstualni zadaci su nam i dalje slaba tačka: lakše rešava sistem nego što ga postavlja iz teksta."

LOŠE (mesečni, opšte fraze):
"Marko je u maju solidno napredovao kroz različite teme, sa vidljivim poboljšanjem u razumevanju gradiva i pozitivnom radnom atmosferom na časovima."

DOBRO (mesečni, konkretne stvari iz beleški):
"U maju je Marko pokrio kvadratne jednačine, Vietove formule i krenuo sa sistemima. Najveći skok desio se sredinom meseca — prelaz iz „pamti formulu uz pomoć" u „samostalno rešava". Diskriminantu razume, ali primena u brzim zadacima još traži vežbu, kao i tekstualni zadaci gde greši u označavanju nepoznatih. Sledeći korak: kontrolna iz sistema."

Vraćaš ISKLJUČIVO strukturisan JSON sa "intro" poljem.`;

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

  // Statistika domaćih za period.
  const homeworkStats = await getHomeworkStatsForPeriod(
    supabase,
    input.student.id,
    period.start,
    period.end,
  );

  // AI uvodni paragraf — hronološke beleške pomažu modelu da napiše prirodan
  // narativ (npr. "krajem nedelje je Marko prešao iz X u Y").
  const lessonNotes = held
    .filter((l) => l.progress_summary && l.progress_summary.trim())
    .map((l) => ({
      date: format(new Date(l.scheduled_at), "d. MMM", { locale: srLatn }),
      rating: l.lesson_rating,
      topics: l.topics_covered ?? [],
      progressSummary: l.progress_summary!.trim(),
    }));

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
    lessonNotes,
    homeworkAssigned: homeworkStats.assigned,
    homeworkSubmitted: homeworkStats.submitted,
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
    homeworkAssigned: homeworkStats.assigned,
    homeworkSubmitted: homeworkStats.submitted,
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
  /** Hronološki — od najstarijeg ka najnovijem. Pomaže AI da uhvati LUK perioda. */
  lessonNotes: Array<{
    date: string; // "2. maj"
    rating: number | null;
    topics: string[];
    progressSummary: string;
  }>;
  homeworkAssigned: number;
  homeworkSubmitted: number;
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
  const callModel = (model: string) => {
    // Haiku ne podržava `effort` parametar — samo Sonnet/Opus.
    const supportsEffort = model.includes("sonnet") || model.includes("opus");
    return client.messages.parse({
      model,
      max_tokens: 400,
      thinking: { type: "disabled" },
      output_config: {
        ...(supportsEffort ? { effort: "low" as const } : {}),
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
  };

  let response;
  try {
    response = await callModel(EXERCISE_MODEL);
  } catch (err) {
    // Fallback na Haiku ako je Sonnet preopterećen (529).
    // Manji model, ali za uvodni paragraf je sasvim dovoljan.
    if (isOverloadedError(err)) {
      response = await callModel(FALLBACK_MODEL);
    } else {
      throw err;
    }
  }

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

  if (input.homeworkAssigned > 0) {
    parts.push(
      `- Domaći: zadato ${input.homeworkAssigned}, predato ${input.homeworkSubmitted}`,
    );
  }

  if (input.lessonNotes.length > 0) {
    parts.push(
      ``,
      `BELEŠKE PROFESORA PO ČASOVIMA (hronološki — koristi za uhvatiti luk perioda):`,
    );
    for (const n of input.lessonNotes.slice(0, 16)) {
      const meta = [
        n.date,
        n.rating !== null ? `★${n.rating}` : null,
        n.topics.length > 0 ? n.topics.join(", ") : null,
      ]
        .filter(Boolean)
        .join(" · ");
      parts.push(`- [${meta}] ${n.progressSummary}`);
    }
  }

  parts.push(
    ``,
    `Napiši 1-2 rečenice uvodnog rezimea u skladu sa pravilima.`,
  );
  return parts.join("\n");
}
