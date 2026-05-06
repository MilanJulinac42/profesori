/**
 * Seed test student "Marko Petrović" povezan sa Milan Julinac org-om,
 * sa 4 completed časova u poslednjoj nedelji, svaki sa belešekom +
 * progress_summary za testiranje izveštaja.
 *
 * Pokretanje:
 *   npx tsx scripts/seed-test-student.ts
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

const conn = process.env.SUPABASE_CONNECTION_STRING;
if (!conn) {
  console.error("Missing SUPABASE_CONNECTION_STRING in .env.local");
  process.exit(1);
}

const TEACHER_NAME_LIKE = "Milan%Julinac%";
const STUDENT_NAME = "Marko Petrović";

const LESSONS: Array<{
  daysAgo: number;
  topics: string[];
  rating: number;
  notes: string;
  progress: string;
  nextPlan: string;
}> = [
  {
    daysAgo: 6,
    topics: ["Kvadratne jednačine", "Rastavljanje na činioce"],
    rating: 4,
    notes:
      "Marko je odlično razumeo rastavljanje na činioce kod kvadratnih trinoma. Uradili smo 8 zadataka, 7 tačno. Greška je bila u jednom kompleksnijem zadatku gde se javila negativna diskriminanta — nije znao šta da radi.",
    progress:
      "Solidno napreduje sa rastavljanjem na činioce. Treba dodatno objasniti slučaj kada je diskriminanta negativna (kompleksni brojevi).",
    nextPlan:
      "Vežbati zadatke gde rešenja nisu cela ili gde je diskriminanta negativna. Uvod u kompleksne brojeve.",
  },
  {
    daysAgo: 4,
    topics: ["Kvadratna formula", "Diskriminanta"],
    rating: 3,
    notes:
      "Prešli smo kvadratnu formulu i diskriminantu. Marku je teško da pamti formulu pa smo radili izvođenje korak po korak. Bio je umoran, brzo je gubio fokus posle 30 min.",
    progress:
      "Razume šta diskriminanta govori o broju rešenja, ali primena formule još nije automatizovana. Potrebno je više ponavljanja kroz domaći.",
    nextPlan:
      "Domaći: 10 zadataka sa kvadratnom formulom (laki, srednji). Sledeći put pregled domaćeg + Vietove formule.",
  },
  {
    daysAgo: 2,
    topics: ["Vietove formule", "Sistemi jednačina"],
    rating: 5,
    notes:
      "Odličan čas! Marko je pripremio domaći (8 od 10 zadataka tačno). Vietove formule je shvatio brzo — povezao ih sa rastavljanjem na činioce. Krenuli smo sa sistemima dve linearne jednačine sa dve nepoznate.",
    progress:
      "Veliki napredak — prešao iz „muči se sa formulom“ u „rešava samostalno“. Vietove formule odlično razume.",
    nextPlan:
      "Sistemi jednačina — Gauss eliminacija, supstitucija. Pripremiti za kontrolnu sledeće nedelje.",
  },
  {
    daysAgo: 1,
    topics: ["Sistemi jednačina", "Tekstualni zadaci"],
    rating: 4,
    notes:
      "Radili smo tekstualne zadatke koji se svode na sistem dve jednačine. Marko ima problem da prevede tekst u jednačinu — često pogreši označavanje nepoznatih. Sami matematički koraci su mu OK kad postavi sistem.",
    progress:
      "Algebra solidna, ali problem rešavanja tekstualnih zadataka traži više vežbe. Konkretno — identifikacija šta je nepoznato i pisanje uslova.",
    nextPlan:
      "Pripremiti za kontrolnu: 5 tekstualnih zadataka iz zbirke (str. 142–145), pregledati zajedno na sledećem času.",
  },
];

async function main() {
  const c = new Client({ connectionString: conn });
  await c.connect();

  // 1) Naći organizaciju Milana Julinca
  const profileRes = await c.query<{
    id: string;
    organization_id: string;
    full_name: string;
  }>(
    `select id, organization_id, full_name
       from public.users
      where full_name ilike $1
      limit 1`,
    [TEACHER_NAME_LIKE],
  );

  if (profileRes.rows.length === 0) {
    console.error(
      `Nije pronađen profil sa imenom koje matchuje '${TEACHER_NAME_LIKE}'.`,
    );
    console.error("Profili u bazi:");
    const all = await c.query("select id, full_name, email from public.users limit 20");
    console.table(all.rows);
    process.exit(1);
  }

  const profile = profileRes.rows[0];
  console.log(
    `Profile: ${profile.full_name} (id=${profile.id}, org=${profile.organization_id})`,
  );

  // 2) Insert (ili reuse) studenta
  const existing = await c.query<{ id: string }>(
    `select id from public.students
      where organization_id = $1 and full_name = $2 and deleted_at is null
      limit 1`,
    [profile.organization_id, STUDENT_NAME],
  );

  let studentId: string;
  if (existing.rows.length > 0) {
    studentId = existing.rows[0].id;
    console.log(`Student već postoji: ${STUDENT_NAME} (id=${studentId})`);
    // Obriši stare lessons da seed bude idempotentan
    await c.query(
      `update public.lessons set deleted_at = now() where student_id = $1 and deleted_at is null`,
      [studentId],
    );
    console.log("Obrisani postojeći časovi (soft delete).");
  } else {
    const ins = await c.query<{ id: string }>(
      `insert into public.students
         (organization_id, full_name, grade, school, parent_name, parent_phone, parent_email,
          default_price_per_lesson, status, report_audience, weekly_reports_enabled, monthly_reports_enabled)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 'active', 'parent', true, true)
       returning id`,
      [
        profile.organization_id,
        STUDENT_NAME,
        "8. razred OŠ",
        "OŠ Vladislav Ribnikar",
        "Ana Petrović",
        "+381611234567",
        "ana.petrovic.test@example.com",
        150000, // 1500 RSD
      ],
    );
    studentId = ins.rows[0].id;
    console.log(`Kreiran student: ${STUDENT_NAME} (id=${studentId})`);
  }

  // 3) Insert lessons
  for (const l of LESSONS) {
    const date = new Date();
    date.setDate(date.getDate() - l.daysAgo);
    date.setHours(17, 0, 0, 0); // 17:00

    await c.query(
      `insert into public.lessons
         (organization_id, student_id, scheduled_at, duration_minutes, status, price,
          notes_after_lesson, topics_covered, lesson_rating, next_lesson_plan, progress_summary)
       values ($1, $2, $3, 60, 'completed', 150000, $4, $5, $6, $7, $8)`,
      [
        profile.organization_id,
        studentId,
        date.toISOString(),
        l.notes,
        l.topics,
        l.rating,
        l.nextPlan,
        l.progress,
      ],
    );
    console.log(
      `  + ${date.toISOString().slice(0, 10)} | ${l.topics.join(", ")} (★${l.rating})`,
    );
  }

  await c.end();
  console.log("\nGotovo. Otvori /students i vidi učenika 'Marko Petrović'.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
