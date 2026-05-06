/**
 * Test recurring lessons logic — kreira seriju od 8 nedeljnih časova
 * (ponedeljkom u 17:00) i onda testira "obriši sve buduće" tako što
 * uzme čas #4 kao anchor i soft-delete-uje sve >= njega.
 *
 * Replicira logiku iz src/lib/lessons/actions.ts ali bez auth-a (direktan
 * Postgres). Koristi se za smoke-test — ne menja realne podatke u prod-u
 * jer pravi novog test-studenta i njega koristi.
 *
 * Pokretanje: npx tsx scripts/test-recurring-lessons.ts
 */
import { config } from "dotenv";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });

const conn = process.env.SUPABASE_CONNECTION_STRING;
if (!conn) {
  console.error("Missing SUPABASE_CONNECTION_STRING");
  process.exit(1);
}

const TEACHER_NAME_LIKE = "Milan%Julinac%";
const STUDENT_NAME = "Marko Petrović";
const COUNT = 8;
const FREQUENCY: "weekly" | "biweekly" = "weekly";

function nextMonday(): Date {
  const d = new Date();
  d.setHours(17, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const daysUntilMon = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMon);
  return d;
}

async function main() {
  const c = new Client({ connectionString: conn });
  await c.connect();

  // Org + student
  const { rows: profiles } = await c.query<{
    organization_id: string;
    full_name: string;
  }>(
    `select organization_id, full_name from public.users where full_name ilike $1 limit 1`,
    [TEACHER_NAME_LIKE],
  );
  if (!profiles[0]) throw new Error("Teacher not found");
  const orgId = profiles[0].organization_id;

  const { rows: students } = await c.query<{ id: string }>(
    `select id from public.students where organization_id=$1 and full_name=$2 and deleted_at is null limit 1`,
    [orgId, STUDENT_NAME],
  );
  if (!students[0]) throw new Error(`Student '${STUDENT_NAME}' not found`);
  const studentId = students[0].id;

  console.log(`Org: ${orgId}`);
  console.log(`Student: ${STUDENT_NAME} (${studentId})`);

  // === STEP 1: Cleanup any existing recurring test data
  await c.query(
    `update public.lessons set deleted_at=now()
     where student_id=$1 and recurrence_group_id is not null and deleted_at is null`,
    [studentId],
  );

  // === STEP 2: Create 8 weekly lessons starting next Mon at 17:00
  const groupId = randomUUID();
  const intervalDays = FREQUENCY === "weekly" ? 7 : 14;
  const start = nextMonday();
  const inserts: { date: Date; conflict: boolean }[] = [];

  for (let i = 0; i < COUNT; i++) {
    const dt = new Date(start.getTime());
    dt.setDate(dt.getDate() + i * intervalDays);

    // Conflict check: any other lesson in org overlapping this time?
    const { rows: conflicts } = await c.query(
      `select id from public.lessons
        where organization_id=$1
          and deleted_at is null
          and tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval, '[)')
              && tstzrange($2::timestamptz, $2::timestamptz + interval '60 minutes', '[)')
        limit 1`,
      [orgId, dt.toISOString()],
    );

    if (conflicts.length > 0) {
      inserts.push({ date: dt, conflict: true });
      continue;
    }

    await c.query(
      `insert into public.lessons
        (organization_id, student_id, scheduled_at, duration_minutes, status, price, recurrence_group_id)
       values ($1, $2, $3, 60, 'scheduled', 150000, $4)`,
      [orgId, studentId, dt.toISOString(), groupId],
    );
    inserts.push({ date: dt, conflict: false });
  }

  console.log(`\n=== STEP 1: Kreirana serija (group=${groupId}) ===`);
  for (const ins of inserts) {
    const tag = ins.conflict ? "SKIP (conflict)" : "OK";
    console.log(`  ${ins.date.toISOString().slice(0, 16)} — ${tag}`);
  }
  const okCount = inserts.filter((i) => !i.conflict).length;
  console.log(`Total kreirano: ${okCount} / ${COUNT}`);

  // === STEP 3: Verify
  const { rows: created } = await c.query<{ id: string; scheduled_at: Date }>(
    `select id, scheduled_at from public.lessons
      where recurrence_group_id=$1 and deleted_at is null
      order by scheduled_at asc`,
    [groupId],
  );
  console.log(`\nU bazi (active u grupi): ${created.length} časova`);

  // === STEP 4: "Obriši sve buduće" — uzmi 4. čas kao anchor
  if (created.length < 4) {
    console.error("Nema dovoljno časova za test brisanja.");
    await c.end();
    return;
  }
  const anchor = created[3];
  console.log(
    `\n=== STEP 2: Obriši sve buduće (anchor=čas #4 @ ${anchor.scheduled_at.toISOString().slice(0, 16)}) ===`,
  );

  const { rowCount: deleted } = await c.query(
    `update public.lessons
        set deleted_at = now()
      where recurrence_group_id = $1
        and scheduled_at >= $2
        and deleted_at is null`,
    [groupId, anchor.scheduled_at],
  );
  console.log(`Soft-deleted: ${deleted} časova`);

  // === STEP 5: Verify final state
  const { rows: alive } = await c.query<{ scheduled_at: Date }>(
    `select scheduled_at from public.lessons
      where recurrence_group_id=$1 and deleted_at is null
      order by scheduled_at asc`,
    [groupId],
  );
  const { rows: dead } = await c.query<{ scheduled_at: Date }>(
    `select scheduled_at from public.lessons
      where recurrence_group_id=$1 and deleted_at is not null
      order by scheduled_at asc`,
    [groupId],
  );
  console.log(`\n=== STEP 3: Stanje posle brisanja ===`);
  console.log(`Aktivni (zadržani): ${alive.length}`);
  for (const l of alive) console.log(`  ${l.scheduled_at.toISOString().slice(0, 16)}`);
  console.log(`Obrisani: ${dead.length}`);
  for (const l of dead) console.log(`  ${l.scheduled_at.toISOString().slice(0, 16)}`);

  // Cleanup
  await c.query(
    `update public.lessons set deleted_at=now()
     where recurrence_group_id=$1 and deleted_at is null`,
    [groupId],
  );
  console.log("\n(Cleanup: svi časovi iz testne grupe soft-delete-ovani.)");

  await c.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
