/**
 * Wipe + seed demo data for a single user (by email).
 *
 * Resetuje sve podatke organizacije, pa popunjava realistic mock-om:
 * - 10 učenika sa pravim srpskim imenima, raznim predmetima i nivoima
 * - Svaki ima 2 časa nedeljno × 4 nedelje istorije = 8 prošlih časova
 * - Plus 2 nadolazeća časa po učeniku
 * - Prošli časovi imaju beleške, topics_covered, ocene, progress_summary
 * - Plaćanja pokrivaju većinu, par dužnika ostaje
 * - Domaći: mix assigned / submitted / graded
 *
 * Pokretanje: TARGET_EMAIL=milanjulinac996@gmail.com npx tsx scripts/seed-demo.ts
 * (ako TARGET_EMAIL nije postavljen, koristi default)
 */

import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

const TARGET_EMAIL = process.env.TARGET_EMAIL ?? "milanjulinac996@gmail.com";

const SUBJECTS = [
  "matematika",
  "fizika",
  "engleski",
  "hemija",
  "srpski",
] as const;

type StudentSpec = {
  full_name: string;
  grade: string;
  school: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  subject: (typeof SUBJECTS)[number];
  price: number; // RSD (script convertuje u para pri INSERT-u)
  duration: number; // minutes
  // weekday1, hour1, weekday2, hour2 — Monday=1 ... Sunday=7
  slot1: { dow: number; hour: number };
  slot2: { dow: number; hour: number };
  status: "active" | "paused";
  tags: string[];
};

const STUDENTS: StudentSpec[] = [
  {
    full_name: "Marko Petrović",
    grade: "8. razred OŠ",
    school: "OŠ Vuk Karadžić",
    parent_name: "Snežana Petrović",
    parent_phone: "+381 64 123 4567",
    parent_email: "snezana.petrovic@example.com",
    subject: "matematika",
    price: 3000,
    duration: 60,
    slot1: { dow: 1, hour: 17 },
    slot2: { dow: 4, hour: 17 },
    status: "active",
    tags: ["mala matura"],
  },
  {
    full_name: "Ana Jovanović",
    grade: "7. razred OŠ",
    school: "OŠ Sveti Sava",
    parent_name: "Dejan Jovanović",
    parent_phone: "+381 65 234 5678",
    parent_email: "dejan.jovanovic@example.com",
    subject: "engleski",
    price: 2800,
    duration: 60,
    slot1: { dow: 2, hour: 16 },
    slot2: { dow: 5, hour: 16 },
    status: "active",
    tags: [],
  },
  {
    full_name: "Stefan Kostić",
    grade: "3. razred srednje",
    school: "Gimnazija Jovan Jovanović Zmaj",
    parent_name: "Milica Kostić",
    parent_phone: "+381 63 345 6789",
    parent_email: "milica.kostic@example.com",
    subject: "fizika",
    price: 3500,
    duration: 90,
    slot1: { dow: 1, hour: 19 },
    slot2: { dow: 3, hour: 19 },
    status: "active",
    tags: ["matura"],
  },
  {
    full_name: "Lana Đorđević",
    grade: "5. razred OŠ",
    school: "OŠ Branko Radičević",
    parent_name: "Jovana Đorđević",
    parent_phone: "+381 62 456 7890",
    parent_email: "jovana.djordjevic@example.com",
    subject: "matematika",
    price: 2500,
    duration: 60,
    slot1: { dow: 2, hour: 18 },
    slot2: { dow: 6, hour: 11 },
    status: "active",
    tags: [],
  },
  {
    full_name: "Petar Nikolić",
    grade: "8. razred OŠ",
    school: "OŠ Drinka Pavlović",
    parent_name: "Nemanja Nikolić",
    parent_phone: "+381 60 567 8901",
    parent_email: "nemanja.nikolic@example.com",
    subject: "matematika",
    price: 3000,
    duration: 60,
    slot1: { dow: 3, hour: 17 },
    slot2: { dow: 6, hour: 10 },
    status: "active",
    tags: ["mala matura"],
  },
  {
    full_name: "Mila Ristić",
    grade: "6. razred OŠ",
    school: "OŠ Knez Sima Marković",
    parent_name: "Tanja Ristić",
    parent_phone: "+381 64 678 9012",
    parent_email: "tanja.ristic@example.com",
    subject: "engleski",
    price: 2500,
    duration: 60,
    slot1: { dow: 1, hour: 16 },
    slot2: { dow: 4, hour: 16 },
    status: "active",
    tags: [],
  },
  {
    full_name: "Nikola Stojanović",
    grade: "1. razred srednje",
    school: "Treća beogradska gimnazija",
    parent_name: "Vesna Stojanović",
    parent_phone: "+381 65 789 0123",
    parent_email: "vesna.stojanovic@example.com",
    subject: "hemija",
    price: 3200,
    duration: 75,
    slot1: { dow: 2, hour: 19 },
    slot2: { dow: 5, hour: 19 },
    status: "active",
    tags: [],
  },
  {
    full_name: "Jelena Marković",
    grade: "4. razred srednje",
    school: "Filološka gimnazija",
    parent_name: "Aleksandar Marković",
    parent_phone: "+381 63 890 1234",
    parent_email: "aleksandar.markovic@example.com",
    subject: "matematika",
    price: 4000,
    duration: 90,
    slot1: { dow: 1, hour: 18 },
    slot2: { dow: 4, hour: 18 },
    status: "active",
    tags: ["matura", "prijemni"],
  },
  {
    full_name: "Filip Ilić",
    grade: "7. razred OŠ",
    school: "OŠ Stari grad",
    parent_name: "Marija Ilić",
    parent_phone: "+381 64 901 2345",
    parent_email: "marija.ilic@example.com",
    subject: "matematika",
    price: 2800,
    duration: 60,
    slot1: { dow: 3, hour: 16 },
    slot2: { dow: 6, hour: 12 },
    status: "active",
    tags: [],
  },
  {
    full_name: "Sara Pavlović",
    grade: "2. razred srednje",
    school: "Matematička gimnazija",
    parent_name: "Bojan Pavlović",
    parent_phone: "+381 62 012 3456",
    parent_email: "bojan.pavlovic@example.com",
    subject: "fizika",
    price: 3500,
    duration: 75,
    slot1: { dow: 2, hour: 17 },
    slot2: { dow: 5, hour: 17 },
    status: "active",
    tags: ["takmičenje"],
  },
];

// Bank realnih beleški po predmetu — random se izvuče za svaki čas
const NOTES_BY_SUBJECT: Record<string, { topics: string[]; notes: string[]; nextPlan: string[]; summary: string[] }> = {
  matematika: {
    topics: [
      "Kvadratne jednačine — diskriminanta i Vietove formule",
      "Sistem linearnih jednačina — metoda zamene i suprotnih koeficijenata",
      "Funkcije — domen, kodomen, grafici linearne i kvadratne funkcije",
      "Procenat, kamatni račun i razmera",
      "Sličnost trouglova i Talesova teorema",
      "Pitagorina teorema — primene u praktičnim problemima",
      "Algebra — sređivanje izraza, kvadrat binoma, razlika kvadrata",
      "Geometrijska tela — zapremine i površine kocke i kvadra",
    ],
    notes: [
      "Učenik dobro razume teorijski deo ali ima poteškoća sa primenom formula u tekstualnim zadacima. Vežbati još tekstualne zadatke iz prošlogodišnje male mature.",
      "Pažljivo proradili smo razliku između suprotnih i jednakih koeficijenata. Treba još utvrditi razdvajanje promenljive sa obe strane jednačine.",
      "Solidan napredak — već samostalno rešava zadatke koje smo prošle nedelje pravili zajedno. Sledeći put povećavamo težinu.",
      "Pravi sistematske greške u znaku kod razlike kvadrata. Domaći namenjen tome.",
      "Razumevanje vrlo brzo, ali površno radi — promašuje koraka jer ne piše svaki red. Treba mu disciplina.",
    ],
    nextPlan: [
      "Završiti vežbe iz radne sveske 4.3—4.7. Pojasniti gde Vieta ne radi.",
      "Tekstualne zadatke iz testova prijemnih ispita 2023/2024.",
      "Geometrija — uvod u trougao i njegove karakteristične tačke.",
    ],
    summary: [
      "Dobar dan rada. Napreduje u algebri ali geometrija i dalje slaba tačka.",
      "Solidan čas — koncepti razumeju ali na ispitu može da padne ako se ne uveži tempo.",
      "Najbolji čas do sada. Sve teme bili na prvi pokušaj.",
    ],
  },
  fizika: {
    topics: [
      "Kinematika — ravnomerno ubrzano kretanje, grafici v(t) i s(t)",
      "Njutnovi zakoni — sila trenja, vučna sila, normalna reakcija",
      "Energija — kinetička, potencijalna, zakon održanja",
      "Elektricitet — Omov zakon, Kirhofovi zakoni u prostom kolu",
      "Talasi — frekvencija, talasna dužina, brzina prostiranja",
      "Termodinamika — gasni zakoni, izoprocesi",
    ],
    notes: [
      "Razume pojam ubrzanja konceptualno ali pravi greške u jedinicama. Posebno paziti na konverziju km/h u m/s.",
      "Vežbali smo zadatke sa kosom ravni — uloga komponenti težine. Sledeći put: trenje u tom kontekstu.",
      "Vrlo dobar napredak — bez problema rešava zadatke koji su pre dve nedelje bili težak.",
      "Električna kola: razlikuje serijsku od paralelne veze, ali se zbuni kod mešane. Treba još vežbe.",
    ],
    nextPlan: [
      "Zadaci sa pisanih ispita iz prošlih godina — kosa ravan + trenje.",
      "Pregled poglavlja o talasima, fokus na zvuk i svetlost.",
      "Pripremni testovi za maturski.",
    ],
    summary: [
      "Konceptualno razumevanje dobro, fali rutina u zadacima.",
      "Vrlo radoznao — postavlja dodatna pitanja koja izlaze van programa. Lepo.",
      "Tempo opao prošle nedelje, ali danas se vratio na nivo.",
    ],
  },
  engleski: {
    topics: [
      "Present Perfect vs Past Simple — kontekst i signalne reči",
      "Pasiv u sva vremena — formacija i upotreba",
      "Conditionals — Type 1, 2 i 3, mixed conditionals",
      "Reported speech — promena vremena, mesta i vremenskih izraza",
      "Phrasal verbs — najfrekventniji u tematskim grupama",
      "Reading comprehension — strategije za FCE tip ispita",
      "Writing — kratki esej, formalno pismo",
    ],
    notes: [
      "Razlikuje Present Perfect od Past Simple u kontekstu, ali u proizvoljnom govoru i dalje koristi Past Simple gde nije adekvatno.",
      "Pasiv: razume teoriju, formira korektno u sadašnjem i prošlom vremenu. Future i Perfect oblicima — treba još vežbe.",
      "Solidan vokabular za uzrast. Izgovor potreban rad — posebno samoglasnici.",
      "Mnogo se popravila na čitanju — bez problema izvlači detaljne informacije iz teksta.",
    ],
    nextPlan: [
      "Vežbe iz radne sveske — Unit 7 (Past Modals).",
      "Slušanje epizode podkasta — diskusija sledeći čas.",
      "Pisanje formalnog pisma na zadatu temu.",
    ],
    summary: [
      "Sigurna kandidatkinja za viši nivo. Ostavi prostor za samostalan rad.",
      "Dobar napredak u govoru — manje pauza, više fluentnosti.",
      "Pasivno znanje veliko, aktivno znatno manje. Više govora.",
    ],
  },
  hemija: {
    topics: [
      "Hemijska veza — kovalentna, jonska, metalna",
      "Periodni sistem elemenata — periodičnost svojstava",
      "Kiseline, baze, soli — pH skala, indikatori",
      "Stehiometrija — odnos masa, molovi, gasovi",
      "Organska hemija — alkani, alkeni, alkini",
    ],
    notes: [
      "Razume razliku između kovalentne i jonske veze. Polarnost veze i molekule — još poraditi.",
      "Stehiometrijski zadaci: solidan rad, ali konverzija mol → masa pravi greške.",
      "Naučio sva pravila imenovanja alkana po IUPAC nomenklaturi. Sledeći — alkeni.",
    ],
    nextPlan: [
      "Vežbe iz zbirke — poglavlje 5 (stehiometrija).",
      "Pregled organskih reakcija — sagorevanje.",
    ],
    summary: [
      "Stabilan napredak. Mora samostalno više da rešava zadatke.",
      "Razume teoriju duboko — više od proseka uzrasta.",
    ],
  },
  srpski: {
    topics: [
      "Padeži — funkcije i karakteristični nastavci",
      "Glagolski oblici — vremena i načini",
      "Sintaksa — nezavisne i zavisne rečenice",
      "Pravopis — interpunkcija, sastavljeno i rastavljeno pisanje",
      "Analiza književnog dela — lik, tema, motiv",
    ],
    notes: [
      "Padeži: nominativ i akuzativ bez problema. Dativ i instrumental — još meša u govoru.",
      "Pravopis — pravila o zapeti u nabrajanju usvojena. Veznici 'i', 'pa', 'ali' — usvojeno.",
      "Književnost: razume idejni sloj teksta. Pisanje sastava — vrlo razvijen rečnik za uzrast.",
    ],
    nextPlan: [
      "Vežbe iz Pravopisa — zapeta uz vokativ.",
      "Analiza pripovetke za sledeći čas — pročitati unapred.",
    ],
    summary: [
      "Solidan čas. Razvija jezičko osećanje.",
      "Pravi napredak vidljiv — manje grešaka u pisanju.",
    ],
  },
};

const HOMEWORK_TITLES: Record<string, string[]> = {
  matematika: [
    "Vežbe iz kvadratnih jednačina — zadaci 12—24",
    "Sistemi jednačina — radna sveska 4.3",
    "Tekstualni zadaci sa procentima",
    "Pitagorina teorema — primene",
  ],
  fizika: [
    "Zadaci iz kinematike — strana 45",
    "Njutnovi zakoni — vežbe 8—15",
    "Elektricitet — kolo i Omov zakon",
  ],
  engleski: [
    "Unit 7 — present perfect exercises",
    "Reading comprehension — text on page 89",
    "Esej: My favourite weekend (150 reči)",
  ],
  hemija: ["Stehiometrija — 5 zadataka iz zbirke"],
  srpski: ["Sastav: Najlepša uspomena iz detinjstva (1 strana)"],
};

const HOMEWORK_FEEDBACK = [
  "Veoma uredan rad, sve tačno. Bravo.",
  "Većina tačno. Pažljivo proveriti zadatak 4 — greška u predznaku.",
  "Solidan rad. Zadaci 6 i 7 nisu rešeni — pogledati zajedno na sledećem času.",
  "Vidi se trud. Vežbati još konverziju jedinica.",
  "Domaći dobro odrađen. Najbolji rezultat do sada.",
];

const SUBMISSION_NOTES = [
  "Sve sam uradila/uradio, treba mi pomoć oko 8.",
  "Zaglavila sam se na zadatku 4 — proverićemo na času.",
  "Sve gotovo.",
  "Trebalo mi je više vremena za posljednja dva.",
  "",
];

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Vraća Date podešen na zadati datum + (dow, hour) ove ili pomerene nedelje. */
function dateForWeek(weeksAgo: number, dow: number, hour: number): Date {
  // dow: 1=ponedeljak ... 7=nedelja
  const now = new Date();
  // početak ove nedelje (ponedeljak) u lokalnoj zoni
  const day = now.getDay() === 0 ? 7 : now.getDay(); // Sunday=0 → 7
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - (day - 1) - weeksAgo * 7);
  const target = new Date(monday);
  target.setDate(monday.getDate() + (dow - 1));
  target.setHours(hour, 0, 0, 0);
  return target;
}

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING,
  });
  await c.connect();

  console.log(`▸ tražim korisnika ${TARGET_EMAIL}…`);
  const userRes = await c.query<{ id: string; organization_id: string; full_name: string }>(
    "select id, organization_id, full_name from users where email=$1 and deleted_at is null",
    [TARGET_EMAIL],
  );

  if (userRes.rowCount === 0) {
    console.error(`✗ Korisnik ${TARGET_EMAIL} nije pronađen.`);
    process.exit(1);
  }

  const user = userRes.rows[0]!;
  const orgId = user.organization_id;
  console.log(`✓ user ${user.id} (org ${orgId})`);

  // 1) WIPE — brišemo sve podatke za ovu organizaciju
  console.log("▸ brišem postojeće podatke…");
  await c.query("begin");
  try {
    // redosled je bitan zbog FK
    await c.query("delete from homework where organization_id=$1", [orgId]);
    await c.query("delete from payments where organization_id=$1", [orgId]);
    await c.query("delete from report_logs where organization_id=$1", [orgId]);
    await c.query("delete from report_comments where organization_id=$1", [orgId]);
    await c.query("delete from reminder_logs where organization_id=$1", [orgId]);
    await c.query("delete from booking_requests where organization_id=$1", [orgId]);
    await c.query("delete from exercise_sets where organization_id=$1", [orgId]);
    await c.query("delete from assistant_messages where conversation_id in (select id from assistant_conversations where organization_id=$1)", [orgId]);
    await c.query("delete from assistant_conversations where organization_id=$1", [orgId]);
    await c.query("delete from lessons where organization_id=$1", [orgId]);
    await c.query("delete from students where organization_id=$1", [orgId]);
    await c.query("commit");
    console.log("✓ obrisano");
  } catch (e) {
    await c.query("rollback");
    throw e;
  }

  // 2) SEED studenti
  console.log("▸ ubacujem 10 učenika…");
  const studentIds: string[] = [];
  for (const s of STUDENTS) {
    const r = await c.query<{ id: string }>(
      `insert into students
       (organization_id, full_name, grade, school, parent_name, parent_phone, parent_email,
        default_price_per_lesson, default_lesson_duration_minutes, status, tags, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning id`,
      [
        orgId,
        s.full_name,
        s.grade,
        s.school,
        s.parent_name,
        s.parent_phone,
        s.parent_email,
        s.price * 100,
        s.duration,
        s.status,
        s.tags,
        `Predmet: ${s.subject}. Redovan termin: ${slotLabel(s.slot1)} i ${slotLabel(s.slot2)}.`,
      ],
    );
    studentIds.push(r.rows[0]!.id);
  }
  console.log(`✓ ${studentIds.length} učenika`);

  // 3) SEED lekcije + plaćanja + domaći
  console.log("▸ ubacujem časove, plaćanja i domaće…");
  let lessonCount = 0;
  let paymentCount = 0;
  let homeworkCount = 0;

  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i]!;
    const studentId = studentIds[i]!;
    const bank = NOTES_BY_SUBJECT[s.subject]!;

    // Prošle 4 nedelje (weeksAgo = 4, 3, 2, 1) → 8 časova
    const pastLessonIds: string[] = [];
    for (let w = 4; w >= 1; w--) {
      for (const slot of [s.slot1, s.slot2]) {
        const at = dateForWeek(w, slot.dow, slot.hour);
        const topics = sample(bank.topics, randInt(1, 2));
        const note = rand(bank.notes);
        const nextPlan = rand(bank.nextPlan);
        const summary = rand(bank.summary);
        const rating = randInt(3, 5);

        const r = await c.query<{ id: string }>(
          `insert into lessons
           (organization_id, student_id, scheduled_at, duration_minutes, status, price,
            notes_after_lesson, topics_covered, lesson_rating, next_lesson_plan, progress_summary)
           values ($1,$2,$3,$4,'completed',$5,$6,$7,$8,$9,$10)
           returning id`,
          [
            orgId,
            studentId,
            at.toISOString(),
            s.duration,
            s.price * 100,
            note,
            topics,
            rating,
            nextPlan,
            summary,
          ],
        );
        pastLessonIds.push(r.rows[0]!.id);
        lessonCount++;
      }
    }

    // Nadolazeća 2 časa (ove i sledeće nedelje, slot1)
    for (const weeksAhead of [0, -1]) {
      // weeksAgo negative = future
      const at = dateForWeek(weeksAhead, s.slot1.dow, s.slot1.hour);
      if (at.getTime() < Date.now()) continue; // ako je prošao, preskoči
      await c.query(
        `insert into lessons
         (organization_id, student_id, scheduled_at, duration_minutes, status, price)
         values ($1,$2,$3,$4,'scheduled',$5)`,
        [orgId, studentId, at.toISOString(), s.duration, s.price * 100],
      );
      lessonCount++;
    }
    for (const weeksAhead of [0, -1]) {
      const at = dateForWeek(weeksAhead, s.slot2.dow, s.slot2.hour);
      if (at.getTime() < Date.now()) continue;
      await c.query(
        `insert into lessons
         (organization_id, student_id, scheduled_at, duration_minutes, status, price)
         values ($1,$2,$3,$4,'scheduled',$5)`,
        [orgId, studentId, at.toISOString(), s.duration, s.price * 100],
      );
      lessonCount++;
    }

    // PLAĆANJA — pokriva većinu prošlih časova
    // Student 3, 7 — leave debt (don't pay last 2 lessons)
    // Student 9 — leave debt (pay only half)
    // Ostali — sva pokrivena
    const totalHeld = pastLessonIds.length;
    let paidLessons = totalHeld;
    if (i === 2 || i === 6) paidLessons = totalHeld - 2;
    if (i === 8) paidLessons = Math.floor(totalHeld / 2);

    if (paidLessons > 0) {
      // 1-2 uplata pokrivaju paidLessons časova (u para)
      const amount = paidLessons * s.price * 100;
      const paidAt = new Date();
      paidAt.setDate(paidAt.getDate() - randInt(3, 18));
      await c.query(
        `insert into payments
         (organization_id, student_id, amount, paid_at, method, note)
         values ($1,$2,$3,$4,$5,$6)`,
        [
          orgId,
          studentId,
          amount,
          paidAt.toISOString(),
          rand(["cash", "transfer"] as const),
          `Uplata za ${paidLessons} ${paidLessons === 1 ? "čas" : "časova"}`,
        ],
      );
      paymentCount++;
    }

    // DOMAĆI — 2-3 po učeniku, varied statuses
    const titles = HOMEWORK_TITLES[s.subject] ?? HOMEWORK_TITLES.matematika!;
    const hwCount = randInt(2, 3);
    for (let h = 0; h < hwCount && h < pastLessonIds.length; h++) {
      const lessonId = pastLessonIds[pastLessonIds.length - 1 - h]!;
      const due = new Date();
      due.setDate(due.getDate() + (h === 0 ? -2 : -5 - h * 3));
      const statusRoll = Math.random();
      let status = "assigned";
      let submittedAt: string | null = null;
      let submissionNote: string | null = null;
      let teacherGrade: number | null = null;
      let teacherFeedback: string | null = null;
      let gradedAt: string | null = null;

      if (statusRoll < 0.5) {
        status = "graded";
        const sub = new Date(due);
        sub.setHours(sub.getHours() - randInt(2, 30));
        submittedAt = sub.toISOString();
        submissionNote = rand(SUBMISSION_NOTES);
        teacherGrade = randInt(3, 5);
        teacherFeedback = rand(HOMEWORK_FEEDBACK);
        const graded = new Date(sub);
        graded.setHours(graded.getHours() + randInt(6, 48));
        gradedAt = graded.toISOString();
      } else if (statusRoll < 0.8) {
        status = "submitted";
        const sub = new Date(due);
        sub.setHours(sub.getHours() - randInt(2, 30));
        submittedAt = sub.toISOString();
        submissionNote = rand(SUBMISSION_NOTES);
      }

      await c.query(
        `insert into homework
         (organization_id, student_id, lesson_id, title, description, due_date, status,
          submission_note, submitted_at, teacher_grade, teacher_feedback, graded_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          orgId,
          studentId,
          lessonId,
          rand(titles),
          `Za sledeći čas — uraditi sve zadatke. Ako se zaglaviš na nekom, beleži pitanje pa ćemo proći zajedno.`,
          due.toISOString().slice(0, 10),
          status,
          submissionNote,
          submittedAt,
          teacherGrade,
          teacherFeedback,
          gradedAt,
        ],
      );
      homeworkCount++;
    }
  }

  console.log(`✓ ${lessonCount} časova, ${paymentCount} uplata, ${homeworkCount} domaćih`);

  await c.end();
  console.log("\n✓ Demo seed gotov!");
}

function slotLabel(slot: { dow: number; hour: number }): string {
  const days = ["", "pon", "uto", "sre", "čet", "pet", "sub", "ned"];
  return `${days[slot.dow]} ${slot.hour}h`;
}

function sample<T>(arr: readonly T[], n: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  while (out.length < n && used.size < arr.length) {
    const i = Math.floor(Math.random() * arr.length);
    if (used.has(i)) continue;
    used.add(i);
    out.push(arr[i]!);
  }
  return out;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
