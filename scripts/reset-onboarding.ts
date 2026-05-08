import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local", override: true });

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING,
  });
  await c.connect();
  const r = await c.query(
    `update public.users set onboarding_completed_at = null where full_name ilike $1 returning id, full_name`,
    ["Milan%Julinac%"],
  );
  console.log("Reset:", r.rows);
  await c.end();
}

main();
