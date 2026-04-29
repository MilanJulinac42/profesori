import { config } from "dotenv";
import { Client } from "pg";
config({ path: ".env.local" });

const packages = [
  {
    name: "Pojedinačni čas",
    sessions: 1,
    price: 250000, // 2500 RSD u parama
    description: "Idealno za prvi probni čas ili ad-hoc pomoć pred test.",
    highlighted: false,
  },
  {
    name: "Mesečna karta",
    sessions: 8,
    price: 1800000, // 18000 RSD
    description:
      "8 časova mesečno · 10% popust · konzistentna saradnja kroz školsku godinu.",
    highlighted: true,
  },
  {
    name: "Priprema za maturu",
    sessions: 20,
    price: 4000000, // 40000 RSD
    description:
      "Intenzivni paket za pripremu velike mature ili prijemnog ispita. 20% popust.",
    highlighted: false,
  },
];

async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await c.connect();
  await c.query(
    "update public.public_profiles set pricing_packages = $1 where slug = 'milan-julinac'",
    [JSON.stringify(packages)],
  );
  console.log(`Seeded ${packages.length} pricing packages.`);
  await c.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
