import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

const connectionString = process.env.SUPABASE_CONNECTION_STRING;
if (!connectionString) {
  console.error("Missing SUPABASE_CONNECTION_STRING in .env.local");
  process.exit(1);
}

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  await client.query(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = new Set(
    (await client.query<{ name: string }>("select name from _migrations")).rows.map(
      (r) => r.name,
    ),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`▶ ${file}`);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into _migrations (name) values ($1)", [file]);
      await client.query("commit");
      ran++;
    } catch (err) {
      await client.query("rollback");
      console.error(`✗ ${file} failed`);
      throw err;
    }
  }

  console.log(ran === 0 ? "Up to date." : `Applied ${ran} migration(s).`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
