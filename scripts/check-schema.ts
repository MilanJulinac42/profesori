import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

async function main() {
  const client = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await client.connect();

  const tables = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `);
  console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));

  const triggers = await client.query(`
    select trigger_name, event_object_schema || '.' || event_object_table as on_table
    from information_schema.triggers
    where trigger_schema in ('public', 'auth')
    order by on_table, trigger_name
  `);
  console.log("Triggers:");
  for (const r of triggers.rows) console.log(`  ${r.on_table} → ${r.trigger_name}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
