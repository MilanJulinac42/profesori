/**
 * Seed Milan's profile with gallery images, intro video and FAQ.
 * Run with: npx tsx scripts/seed-content.ts
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

// Education / teaching themed Unsplash images (free, direct CDN URLs).
const galleryImages = [
  {
    url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80",
    caption: "Tabla — geometrija i izvodi",
  },
  {
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80",
    caption: "Beleške i radni prostor",
  },
  {
    url: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=1200&auto=format&fit=crop&q=80",
    caption: "Online čas — Zoom sesija",
  },
  {
    url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80",
    caption: "Vežbanje zadataka iz pripreme za prijemni",
  },
  {
    url: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&auto=format&fit=crop&q=80",
    caption: "Programiranje — Python primer",
  },
  {
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80",
    caption: "Pripremni materijali",
  },
  {
    url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80",
    caption: "Knjige i udžbenici",
  },
  {
    url: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&auto=format&fit=crop&q=80",
    caption: "Kalkulacije na blokčiću",
  },
];

// Educational intro video — 3blue1brown "Essence of calculus" trailer.
// Kvalitetan, nekontroverzan, dostupan.
const introVideoUrl = "https://www.youtube.com/watch?v=WUvTyaaNkzM";

const faqItems = [
  {
    question: "Da li dolazite kući kod učenika?",
    answer:
      "Da, dolazim kući unutar Beograda. Putni troškovi su uračunati u cenu za udaljenost do 10 km. Za predgrađa (Borča, Surčin, Mladenovac) dogovaramo posebno.",
  },
  {
    question: "Koliko traje jedan čas?",
    answer:
      "Standardni čas traje 60 minuta. Za mlađe učenike (do 10 godina) često radim 45 minuta — koncentracija pada brže. Tinejdžeri i fakultetski nivo mogu i 90 minuta po dogovoru.",
  },
  {
    question: "Kako se plaća?",
    answer:
      "Najčešće gotovinski na samom času, ili kroz mesečnu kartu unapred (ima popust). Mogu i kroz Revolut ili klasičan transfer na račun. Sve je preko evidencije, fer i transparentno.",
  },
  {
    question: "Mogu li probni čas?",
    answer:
      "Naravno. Prvi čas je standardno plaćen kao pojedinačni, ali ako ne odgovara — ne nastavljamo, bez obaveze. Tako se uveriš da sam pravi profesor za tvoje dete pre nego što kreneš sa mesečnom kartom.",
  },
  {
    question: "Šta je potrebno da dete ponese?",
    answer:
      "Sveska, pisaljka, knjiga iz škole (ako postoji), konkretan zadatak/test koji im je problem. Sve ostalo — radni listovi, rešenja, dodatne vežbe — donosim ja. Za online: stabilna internet konekcija i kamera (poželjna ali ne obavezna).",
  },
  {
    question: "Koliko često se preporučuju časovi?",
    answer:
      "Dva časa nedeljno daju najbolje rezultate kad treba popravljati ocenu ili spremiti maturu/prijemni. Jedan čas nedeljno radi za održavanje znanja. Tri+ časa nedeljno samo u intenzivnoj pripremi (poslednji mesec pred prijemni).",
  },
  {
    question: "Šta ako učenik mora da otkaže čas?",
    answer:
      "Ako otkažeš najmanje 4 sata pre časa — bez naplate, prebacujemo na drugi termin. Otkazivanja u poslednji čas (manje od 2h) ili ne-pojavljivanje — naplaćujem pun iznos. To je standardna praksa, fer prema oba.",
  },
  {
    question: "Da li radite sa decom sa smetnjama u učenju?",
    answer:
      "Da. Imam iskustva sa decom sa disleksijom, ADHD-om i opštim teškoćama u pamćenju. Tempo prilagođavam, koristim vizualne metode i puno ponavljanja. Pre prvog časa volim da popričam sa roditeljem 10ak minuta da razumem šta je situacija.",
  },
];

async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await c.connect();
  await c.query(
    `update public.public_profiles set
       gallery_images = $1,
       intro_video_url = $2,
       intro_video_autoplay = false,
       faq_items = $3
     where slug = 'milan-julinac'`,
    [JSON.stringify(galleryImages), introVideoUrl, JSON.stringify(faqItems)],
  );
  console.log(
    `Seeded: ${galleryImages.length} slika, video, ${faqItems.length} pitanja.`,
  );
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
