import { config } from "dotenv";
import { Client } from "pg";
config({ path: ".env.local" });
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await c.connect();
  await c.query("update public.public_profiles set contact_phone = $1 where slug = 'milan-julinac'", ["+381 64 123 4567"]);
  console.log("phone set");
  await c.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
