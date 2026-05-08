/**
 * Seed nekoliko homeworks za Marka Petrovića da bi roditeljski portal
 * imao šta da prikaže.
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local", override: true });

const conn = process.env.SUPABASE_CONNECTION_STRING;
if (!conn) {
  console.error("Missing SUPABASE_CONNECTION_STRING");
  process.exit(1);
}

const TEACHER = "Milan%Julinac%";
const STUDENT = "Marko Petrović";

async function main() {
  const c = new Client({ connectionString: conn });
  await c.connect();

  const { rows: profiles } = await c.query<{
    organization_id: string;
  }>(
    `select organization_id from public.users where full_name ilike $1 limit 1`,
    [TEACHER],
  );
  if (!profiles[0]) throw new Error("Teacher not found");
  const orgId = profiles[0].organization_id;

  const { rows: students } = await c.query<{ id: string }>(
    `select id from public.students where organization_id=$1 and full_name=$2 and deleted_at is null limit 1`,
    [orgId, STUDENT],
  );
  if (!students[0]) throw new Error("Student not found");
  const studentId = students[0].id;

  // Soft delete postojeće za clean re-seed
  await c.query(
    `update public.homework set deleted_at=now() where student_id=$1 and deleted_at is null`,
    [studentId],
  );

  const HOMEWORKS = [
    {
      daysAgo: 14,
      title: "Tekstualni zadaci str. 142–145",
      description:
        "Zadaci 1–5 sa strane 142, plus 3 sa strane 145 (sistem dve jednačine).",
      due: -10,
      status: "graded",
      teacher_grade: 4,
      teacher_feedback:
        "Solidno. Greška u zadatku 4 — pogrešno označavanje nepoznatih.",
      submission_note: "Zadatak 4 mi je bio težak — možeš li da objasniš?",
    },
    {
      daysAgo: 7,
      title: "Diskriminanta i broj rešenja",
      description: "Zadaci sa stranе 158: D>0, D=0, D<0 — odredi broj rešenja.",
      due: -3,
      status: "submitted",
      teacher_grade: null,
      teacher_feedback: null,
      submission_note: "Uradio sam sve. 5. mi nije jasan, mislim da fali nešto.",
    },
    {
      daysAgo: 1,
      title: "Vietove formule",
      description:
        "Pripremni zadaci za kontrolnu — 8 zadataka sa formulama suma/proizvod.",
      due: 4,
      status: "assigned",
      teacher_grade: null,
      teacher_feedback: null,
      submission_note: null,
    },
  ];

  for (const hw of HOMEWORKS) {
    const created = new Date();
    created.setDate(created.getDate() - hw.daysAgo);
    const due = new Date();
    due.setDate(due.getDate() + hw.due);

    await c.query(
      `insert into public.homework
        (organization_id, student_id, title, description, due_date, status,
         teacher_grade, teacher_feedback, graded_at,
         submission_note, submitted_at, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        orgId,
        studentId,
        hw.title,
        hw.description,
        due.toISOString().slice(0, 10),
        hw.status,
        hw.teacher_grade,
        hw.teacher_feedback,
        hw.status === "graded" ? new Date().toISOString() : null,
        hw.submission_note,
        hw.status === "submitted" || hw.status === "graded"
          ? new Date(created.getTime() + 86400000).toISOString()
          : null,
        created.toISOString(),
      ],
    );
    console.log(`  + ${hw.title} (${hw.status})`);
  }

  // Takođe: postojeće drafts → sent (samo radi testiranja portala)
  const { rowCount: updated } = await c.query(
    `update public.report_logs set status='sent', sent_at=updated_at, recipient_email='ana.petrovic.test@example.com'
      where student_id=$1 and status='draft'`,
    [studentId],
  );
  console.log(`  Updated ${updated} draft reports → sent`);

  await c.end();
  console.log("\nGotovo. Refresh-uj /r portal da vidiš podatke.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
