import { config } from "dotenv";
import { Client } from "pg";
config({ path: ".env.local" });

async function main() {
  const theme = process.argv[2];
  if (!theme) {
    console.error("Usage: tsx scripts/set-theme.ts <aurora|minimal|sage|sunrise|editorial>");
    process.exit(1);
  }
  const c = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await c.connect();
  await c.query("update public.public_profiles set theme = $1 where slug = 'milan-julinac'", [theme]);
  console.log(`Set theme = ${theme}`);
  await c.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
