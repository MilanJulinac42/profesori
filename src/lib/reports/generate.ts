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
import type {
  CurriculumProgressBlock,
  LessonInReport,
  ReportData,
  ReportKind,
} from "./types";
import { getStudentPlan } from "@/lib/curriculum/queries";

const IntroSchema = z.object({
  intro: z
    .string()
    .min(20)
    .max(800)
    .describe(
      "Uvodni paragraf izveštaja na srpskom (latinica). 1-2 rečenice za nedeljni, 2-4 za mesečni. Konkretne stvari iz beleški, ne floskule.",
    ),
});

const NextStepsSchema = z.object({
  next_summary: z
    .string()
    .min(10)
    .max(400)
    .describe(
      "1-2 rečenice o tome šta sledi, formulisane ZA RODITELJA (ne za profesora). Bez instrukcija profesoru, bez 'roditeljima preporučujemo da...'.",
    ),
});

const NEXT_STEPS_SYSTEM = `Ti pišeš sekciju "Šta sledi" izveštaja koji ide roditelju. Imaš na raspolaganju profesorske beleške "next_lesson_plan" sa više časova u periodu. Tvoj zadatak je da iz njih izvučeš 1-2 rečenice ZA RODITELJA.

PRAVILA:
- Pišeš šta će učenik raditi sledeće nedelje/mesec, ne profesor.
- Roditelju je interesantna OBLAST i CILJ, ne mikro-instrukcije ("str. 163 zad. 6").
- Ako više beleški govori slično, sažimaj. Ako su raznolike, izvuci dominantan pravac.
- Bez instrukcija roditelju ("preporučujemo da sedite sa Markom") — to je nelagodno.
- Bez fraza tipa "Učenik će..." — koristi 3. lice ime ako je publika roditelj, 2. lice ako je sam učenik.
- Ton: kratko, profesionalno, smireno.

PRIMERI:

LOŠE (sirov plan, prelong, instrukcije profesoru i roditelju):
"Marko rešava tri zadatka bez ikakve pomoći — jedan tekstualni (str. 163 zad. 6), jedan sa određivanjem broja rešenja i jedan sa Vietovim formulama (str. 160 zad. 3). Težište ostaje na koraku izračunavanja diskriminante kada je c negativno. Roditeljima preporučiti da sede sa Markom dok ne uradi zadatke."

DOBRO (sažeto, ka roditelju):
"Sledeća nedelja je posvećena pripremi za kontrolnu — Marko će samostalno rešavati zadatke iz kvadratnih jednačina i Vietovih formula, sa fokusom na ispravljanje greške koja se ponavlja više časova zaredom."

Vraćaš ISKLJUČIVO JSON sa "next_summary" poljem.`;


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

  // Plan za sledeći put — sakupimo SVE next_lesson_plan-ove iz perioda
  // (najnoviji ka najstarijem) pa AI sažima za roditelja.
  const allNextPlans = [...lessonsRaw]
    .reverse()
    .map((l) => l.next_lesson_plan?.trim())
    .filter((p): p is string => !!p && p.length > 0);

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

  // AI sažet "Šta sledi" za roditelja (preuzima sirove plan-ove i piše 1-2 rec).
  const nextSummary = await summarizeNextSteps({
    plans: allNextPlans,
    audience: input.student.report_audience,
    studentName: input.student.full_name,
  });

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

  // Curriculum progress — best-effort. If no curricula assigned, returns null.
  const curriculumProgress = await computeCurriculumProgress(
    supabase,
    input.student.id,
    lessonsRaw.map((l) => l.id),
    period.start,
    period.end,
  );

  // Pull the org's custom closing line (for the audience), if set.
  const customClosing =
    input.student.report_audience === "parent"
      ? settings.report_closing_parent
      : settings.report_closing_student;

  return {
    kind: input.kind,
    audience: input.student.report_audience,
    studentName: input.student.full_name,
    studentGrade: input.student.grade,
    parentName: input.student.parent_name,
    teacherName: input.teacherName,
    customClosing,
    periodStart: period.start,
    periodEnd: period.end,
    periodLabel: period.label,
    lessonsHeld: held.length,
    lessonsCancelled: cancelled.length,
    totalMinutes,
    topTopics,
    avgRating,
    lessons,
    nextLessonPlan: nextSummary,
    paidThisPeriod,
    totalDebtNow: billing.debt,
    homeworkAssigned: homeworkStats.assigned,
    homeworkSubmitted: homeworkStats.submitted,
    curriculumProgress,
    aiIntro: ai.intro,
    aiInputTokens: ai.inputTokens,
    aiOutputTokens: ai.outputTokens,
  };
}

async function computeCurriculumProgress(
  supabase: SupabaseClient,
  studentId: string,
  lessonIdsInPeriod: string[],
  periodStart: Date,
  periodEnd: Date,
): Promise<CurriculumProgressBlock | null> {
  const plan = await getStudentPlan(supabase, studentId);
  if (plan.active.length === 0) return null;

  const lessonIdSet = new Set(lessonIdsInPeriod);
  const startIso = periodStart.toISOString();
  const endIso = periodEnd.toISOString();

  const curricula = plan.active.map((a) => {
    // Leaves = subtopics + sections without children.
    const leaves = a.units.filter(
      (u) =>
        u.parent_unit_id !== null ||
        !a.units.some((c) => c.parent_unit_id === u.id),
    );
    const titleById = new Map(leaves.map((u) => [u.id, u.title]));
    const progressByUnit = new Map(a.progress.map((p) => [p.unit_id, p]));

    let masteredTotal = 0;
    const newlyMastered: string[] = [];
    const inProgressNow: string[] = [];
    for (const u of leaves) {
      const p = progressByUnit.get(u.id);
      if (!p) continue;
      if (p.status === "mastered") {
        masteredTotal++;
        if (
          p.mastered_at &&
          p.mastered_at >= startIso &&
          p.mastered_at <= endIso
        ) {
          newlyMastered.push(titleById.get(u.id) ?? u.title);
        }
      } else if (p.status === "in_progress") {
        // Touched this period iff last_lesson_id ∈ period lessons.
        if (p.last_lesson_id && lessonIdSet.has(p.last_lesson_id)) {
          inProgressNow.push(titleById.get(u.id) ?? u.title);
        }
      }
    }
    const totalUnits = leaves.length;
    const pct = totalUnits === 0 ? 0 : Math.round((masteredTotal / totalUnits) * 100);
    return {
      name: a.curriculum.name,
      subject: a.curriculum.subject,
      gradeLabel: a.curriculum.grade_label,
      progressPct: pct,
      totalUnits,
      masteredTotal,
      newlyMastered,
      inProgressNow,
    };
  });

  return { curricula };
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

/**
 * Sažima više `next_lesson_plan` zapisa u 1-2 rečenice za roditelja/učenika.
 * Ako nema planova → null. Ako je samo jedan KRATAK plan, vrati njega bez AI.
 */
async function summarizeNextSteps(input: {
  plans: string[];
  audience: ReportAudience;
  studentName: string;
}): Promise<string | null> {
  if (input.plans.length === 0) return null;

  // Optimizacija: ako je samo jedan plan i kratak je, ne troši Anthropic.
  if (input.plans.length === 1 && input.plans[0]!.length <= 180) {
    return input.plans[0]!;
  }

  const userPrompt = [
    `PUBLIKA: ${input.audience}`,
    `UČENIK: ${input.studentName}`,
    ``,
    `PROFESORSKE BELEŠKE "ŠTA SLEDI" (najnovije prvo):`,
    ...input.plans.slice(0, 8).map((p, i) => `${i + 1}. ${p}`),
    ``,
    `Sažmi u 1-2 rečenice ZA ${
      input.audience === "parent" ? "roditelja" : "samog učenika"
    } u skladu sa pravilima.`,
  ].join("\n");

  try {
    const client = getAnthropic();
    const callModel = (model: string) => {
      const supportsEffort = model.includes("sonnet") || model.includes("opus");
      return client.messages.parse({
        model,
        max_tokens: 300,
        thinking: { type: "disabled" },
        output_config: {
          ...(supportsEffort ? { effort: "low" as const } : {}),
          format: zodOutputFormat(NextStepsSchema),
        },
        system: [
          {
            type: "text",
            text: NEXT_STEPS_SYSTEM,
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
      if (isOverloadedError(err)) response = await callModel(FALLBACK_MODEL);
      else throw err;
    }

    if (!response.parsed_output) {
      // Fallback: vrati najnoviji plan kao raw.
      return input.plans[0] ?? null;
    }
    return response.parsed_output.next_summary;
  } catch {
    // Tihi fallback — bolje sirov plan nego nista.
    return input.plans[0] ?? null;
  }
}
