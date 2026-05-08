/**
 * Simulacija realne istorije 20 časova za studenta Marka Petrovića.
 *
 * Cilj: ispuniti bazu sa kvalitetnim AI generisanim beleškama tako da
 * možemo da testiramo kako izgledaju nedeljni i mesečni izveštaji na
 * stvarnim podacima (ne samo na 4 fiksne lekcije iz seed skripte).
 *
 * Kako:
 *   1. Obriše sve postojeće (soft) časove i izveštaje za Marka.
 *   2. Generiše 20 lekcija raspoređenih unazad ~7 nedelja (3 časa nedeljno).
 *   3. Za svaku, poziva Sonnet da NA OSNOVU PROGRESIJE generiše:
 *        - notes_after_lesson (slobodni opis)
 *        - progress_summary (rezime za izveštaj)
 *        - topics_covered (1-3 teme iz curriculum-a)
 *        - lesson_rating (1-5)
 *        - next_lesson_plan
 *   4. Sledeća lekcija se generise SA KONTEKSTOM prethodne 3 lekcije
 *      (model "vidi" istoriju i pravi konzistentan luk).
 *
 * Curriculum za 8. razred matematika (logična progresija od pre 7 nedelja):
 *   - Realni brojevi i ponavljanje
 *   - Linearne jednačine i nejednačine
 *   - Sistemi linearnih jednačina
 *   - Kvadratne jednačine
 *   - Funkcije
 *   - Geometrija (Pitagorina teorema, geometrijska tela)
 *
 * Pokretanje: npx tsx scripts/simulate-lessons.ts
 */
import { config } from "dotenv";
import { Client } from "pg";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

config({ path: ".env.local", override: true });

const conn = process.env.SUPABASE_CONNECTION_STRING;
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!conn || !apiKey) {
  console.error("Missing env (SUPABASE_CONNECTION_STRING, ANTHROPIC_API_KEY)");
  process.exit(1);
}

const ai = new Anthropic({ apiKey, maxRetries: 5 });
const MODEL = "claude-sonnet-4-6";

const STUDENT_NAME = "Marko Petrović";
const TEACHER_NAME_LIKE = "Milan%Julinac%";
const COUNT = 20;

const CURRICULUM_ARC = [
  // Pocetne lekcije (najstarije)
  { focus: "Realni brojevi, korenovanje, stepenovanje", weeksAgo: 7 },
  { focus: "Linearne jednačine, primena", weeksAgo: 6 },
  { focus: "Linearne nejednačine", weeksAgo: 5 },
  { focus: "Sistemi linearnih jednačina", weeksAgo: 4 },
  { focus: "Kvadratne jednačine, rastavljanje na činioce", weeksAgo: 3 },
  { focus: "Kvadratna formula i diskriminanta", weeksAgo: 2 },
  { focus: "Vietove formule, primena na sisteme", weeksAgo: 1 },
  { focus: "Tekstualni zadaci, priprema za kontrolnu", weeksAgo: 0 },
];

const LessonSchema = z.object({
  topics_covered: z.array(z.string().min(2)).min(1).max(4),
  lesson_rating: z.number().int().min(1).max(5),
  notes_after_lesson: z.string().min(40).max(2000),
  progress_summary: z.string().min(40).max(800),
  next_lesson_plan: z.string().min(20).max(600),
});

type Lesson = z.infer<typeof LessonSchema> & {
  scheduled_at: Date;
};

const SYSTEM = `Ti si profesor matematike u Srbiji koji popunjava beleške posle časa za 8. razred OS, učenik Marko Petrović. Pišeš na srpskom (latinica), profesionalno ali toplo, kao stvarne beleške koje se kasnije koriste za izveštaj roditelju.

PRAVILA:
- Beleške moraju biti KONKRETNE — ne uopšteno ("dobro je radio"), nego specifično ("rešavao je tri zadatka tipa X, na poslednjem je zapeo na koraku Y").
- Progress_summary je 2-3 rečenice za roditelja — fokus na šta je naučio i gde su slabe tačke.
- Notes_after_lesson je duža (3-5 rečenica) interna beleška, može pominjati emocionalno stanje, ponašanje, šta je trebalo da uradi za domaći ali nije, itd.
- Next_lesson_plan je konkretan plan: tema + možda strana iz zbirke + šta će biti težište.
- Konzistentnost sa istorijom — svaka beleška mora se logički nadovezivati na prethodne. Ako su u prošlom času pokrili kvadratnu formulu, sada se ne vraćaju na osnove razlomaka.
- Realan luk: ima časova kad je super (★4-5), ima kad je teško (★2-3). Ne sve ★5.
- Topics_covered: 1-3 konkretne teme (npr. "Kvadratna formula", "Diskriminanta"), ne maglovito.

Vraćaš ISKLJUČIVO JSON sa traženim poljima.`;

async function generateLessonNotes(input: {
  date: Date;
  focus: string;
  history: { date: Date; topics: string[]; rating: number; summary: string; plan: string }[];
}): Promise<z.infer<typeof LessonSchema>> {
  const histLines = input.history.slice(-3).map((h) => {
    return `[${h.date.toISOString().slice(0, 10)} · ★${h.rating} · ${h.topics.join(", ")}]
  Sažetak: ${h.summary}
  Plan koji je tada zapisan za sledeći put: ${h.plan}`;
  });

  const userPrompt = [
    `DATUM ČASA: ${input.date.toISOString().slice(0, 10)}`,
    `OPŠTI FOKUS PERIODA: ${input.focus}`,
    "",
    input.history.length > 0
      ? "POSLEDNJE 3 LEKCIJE (istorija):"
      : "Ovo je PRVI čas u ovom periodu — krećemo iz osnove sa Markom.",
    "",
    ...histLines,
    "",
    "Generiši beleške za ovaj čas. Konzistentno se nadoveži na prošli plan ako postoji.",
  ].join("\n");

  const res = await ai.messages.parse({
    model: MODEL,
    max_tokens: 1500,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(LessonSchema),
    },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!res.parsed_output) throw new Error("No parsed output");
  return res.parsed_output;
}

function computeLessonDates(): Date[] {
  // 20 časova raspoređenih kroz 7 nedelja (po 3 nedeljno + jedan višak).
  // Pon, sre, pet u 17:00.
  const result: Date[] = [];
  const today = new Date();
  today.setHours(17, 0, 0, 0);

  // Krećemo od 7 nedelja unazad, pridružujemo do COUNT termina.
  let weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7 * 7);
  // Pomeri na ponedeljak te nedelje
  while (weekStart.getDay() !== 1) {
    weekStart.setDate(weekStart.getDate() + 1);
  }

  const weekdays = [1, 3, 5]; // Pon, Sre, Pet
  while (result.length < COUNT) {
    for (const wd of weekdays) {
      if (result.length >= COUNT) break;
      const d = new Date(weekStart);
      d.setDate(d.getDate() + (wd - 1));
      if (d <= today) result.push(d);
    }
    weekStart.setDate(weekStart.getDate() + 7);
  }

  return result.sort((a, b) => a.getTime() - b.getTime());
}

function pickFocusForDate(allDates: Date[], idx: number): string {
  // Mapiranje: idx u CURRICULUM_ARC je proporcionalno kroz period.
  const arcIdx = Math.min(
    CURRICULUM_ARC.length - 1,
    Math.floor((idx / Math.max(1, allDates.length - 1)) * CURRICULUM_ARC.length),
  );
  return CURRICULUM_ARC[arcIdx]!.focus;
}

async function main() {
  const c = new Client({ connectionString: conn });
  await c.connect();

  const { rows: profiles } = await c.query<{
    organization_id: string;
  }>(
    `select organization_id from public.users where full_name ilike $1 limit 1`,
    [TEACHER_NAME_LIKE],
  );
  if (!profiles[0]) throw new Error("Teacher not found");
  const orgId = profiles[0].organization_id;

  const { rows: students } = await c.query<{ id: string }>(
    `select id from public.students where organization_id=$1 and full_name=$2 and deleted_at is null limit 1`,
    [orgId, STUDENT_NAME],
  );
  if (!students[0]) throw new Error(`Student '${STUDENT_NAME}' not found — pokreni seed-test-student.ts prvo`);
  const studentId = students[0].id;

  console.log(`Org: ${orgId}, Student: ${studentId}`);

  // 1) Cleanup — soft delete sve postojeće lessons + report logs + homework
  console.log("\n[1] Cleanup postojećih podataka...");
  await c.query(
    `update public.lessons set deleted_at=now() where student_id=$1 and deleted_at is null`,
    [studentId],
  );
  await c.query(`delete from public.report_logs where student_id=$1`, [studentId]);
  await c.query(
    `update public.homework set deleted_at=now() where student_id=$1 and deleted_at is null`,
    [studentId],
  );
  console.log("  done.");

  // 2) Compute dates and generate lessons one-by-one
  console.log(`\n[2] Generišem ${COUNT} lekcija sa AI (može da potraje par minuta)...`);
  const dates = computeLessonDates();
  const history: Lesson[] = [];

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]!;
    const focus = pickFocusForDate(dates, i);
    process.stdout.write(`  ${i + 1}/${dates.length} ${date.toISOString().slice(0, 10)} (${focus.slice(0, 30)}...) `);

    try {
      const notes = await generateLessonNotes({
        date,
        focus,
        history: history.map((h) => ({
          date: h.scheduled_at,
          topics: h.topics_covered,
          rating: h.lesson_rating,
          summary: h.progress_summary,
          plan: h.next_lesson_plan,
        })),
      });
      const lesson: Lesson = { ...notes, scheduled_at: date };
      history.push(lesson);

      await c.query(
        `insert into public.lessons
          (organization_id, student_id, scheduled_at, duration_minutes, status, price,
           notes_after_lesson, topics_covered, lesson_rating, next_lesson_plan, progress_summary)
         values ($1, $2, $3, 60, 'completed', 150000, $4, $5, $6, $7, $8)`,
        [
          orgId,
          studentId,
          date.toISOString(),
          notes.notes_after_lesson,
          notes.topics_covered,
          notes.lesson_rating,
          notes.next_lesson_plan,
          notes.progress_summary,
        ],
      );
      console.log(`★${notes.lesson_rating} ${notes.topics_covered.join(", ")}`);
    } catch (err) {
      console.log(`FAIL: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 3) Verify
  console.log("\n[3] Verifikacija...");
  const { rows: countRows } = await c.query<{ count: string }>(
    `select count(*) from public.lessons where student_id=$1 and deleted_at is null and status='completed'`,
    [studentId],
  );
  console.log(`  ${countRows[0]!.count} lekcija u bazi.`);

  // Distribucija per nedelja
  const { rows: weekRows } = await c.query<{ week: string; n: string; avg_rating: string }>(
    `select to_char(date_trunc('week', scheduled_at), 'YYYY-MM-DD') as week,
            count(*) as n,
            round(avg(lesson_rating)::numeric, 1) as avg_rating
       from public.lessons
      where student_id=$1 and deleted_at is null and status='completed'
      group by 1 order by 1`,
    [studentId],
  );
  console.log("\n  Nedeljna distribucija:");
  for (const r of weekRows) {
    console.log(`    ${r.week}  ${r.n} časa  ★${r.avg_rating}`);
  }

  await c.end();

  console.log("\nGotovo!");
  console.log("\nSledeći koraci za testiranje:");
  console.log(`  1. Otvori /students/${studentId}`);
  console.log("  2. Klikni Pregled na nedeljnom i mesečnom izveštaju");
  console.log("  3. Vidi kako AI piše uvod kad ima 20 lekcija");
  console.log("  4. U /schedule, klikni 'Zakaži čas' za Marka — vidi AI predlog");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
