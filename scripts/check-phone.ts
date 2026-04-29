import { config } from "dotenv";
import { Client } from "pg";
config({ path: ".env.local" });
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await c.connect();
  const r = await c.query("select slug, contact_phone, contact_email from public.public_profiles where slug = 'milan-julinac'");
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
