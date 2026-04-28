/**
 * Seed Milan's public profile with sample data so he can preview the page.
 * Run with: npm run db:seed-profile
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

const TARGET_EMAIL = "milanjulinac996@gmail.com";

const profileData = {
  display_name: "Milan Julinac",
  bio: `Profesor matematike i informatike sa preko 8 godina iskustva u radu sa učenicima različitih uzrasta.

Verujem da svako dete može da nauči matematiku — samo treba pravi pristup. Časove prilagođavam tempu i interesovanjima učenika, sa puno primera iz svakodnevnog života i programiranja.

Specijalizovan sam za pripremu za malu i veliku maturu, prijemne ispite za fakultet, kao i takmičenja iz matematike i informatike.`,
  subjects: ["Matematika", "Informatika", "Programiranje", "Fizika"],
  levels: ["Viši razredi OŠ", "Gimnazija", "Srednja stručna škola", "Fakultet"],
  specialties: [
    "Priprema za malu maturu",
    "Priprema za veliku maturu",
    "Priprema za prijemni ispit",
    "Olimpijade i takmičenja",
    "Domaći zadaci",
  ],
  formats: [
    "Online (Zoom / Meet)",
    "Profesor dolazi kući",
    "Hibridno",
    "Individualni časovi",
  ],
  languages: ["Srpski", "Engleski"],
  years_experience: "8+ godina iskustva · software inženjer i profesor",
  price_range_text: "od 2500 RSD/čas",
  location: "Beograd / Online širom Srbije",
  contact_email: "milanjulinac996@gmail.com",
  available_for_new_students: true,
  published: true,
  links: [
    { type: "linkedin", url: "https://www.linkedin.com/in/milanjulinac/" },
    { type: "github", url: "https://github.com/MilanJulinac42" },
    { type: "instagram", url: "https://www.instagram.com/milanjulinac/" },
    { type: "website", url: "https://milanjulinac.rs" },
  ],
  qualifications: [
    {
      title: "Master inženjer informatike",
      institution: "Fakultet organizacionih nauka, Beograd",
      year: "2019",
    },
    {
      title: "Diplomirani inženjer informatike",
      institution: "Fakultet organizacionih nauka, Beograd",
      year: "2017",
    },
    {
      title: "Cambridge C2 Proficiency",
      institution: "Cambridge English",
      year: "2018",
    },
  ],
  experiences: [
    {
      title: "Senior software inženjer",
      organization: "Tech firma · Beograd",
      period: "2022 — sada",
      description:
        "Razvoj cloud infrastrukture i web aplikacija. Mentorstvo juniorima.",
    },
    {
      title: "Profesor matematike i informatike",
      organization: "Privatni časovi",
      period: "2017 — sada",
      description:
        "Individualni i grupni časovi za učenike OŠ, srednje škole i fakulteta. Više od 80 učenika do sada.",
    },
    {
      title: "Software inženjer",
      organization: "Startup · Beograd",
      period: "2019 — 2022",
      description:
        "Full-stack razvoj web aplikacija. JavaScript, React, Python.",
    },
  ],
  testimonials: [
    {
      quote:
        "Milan je odličan profesor — moj sin je za 3 meseca podigao ocenu iz matematike sa 3 na 5. Jako strpljiv i jasan u objašnjavanju.",
      author: "Marija P.",
      relation: "Roditelj učenika 7. razreda",
    },
    {
      quote:
        "Lako objašnjava kompleksne stvari, časovi su uvek dinamični i nikad mi nije bilo dosadno. Sa Milanom sam položio prijemni za FON sa odličnim rezultatom.",
      author: "Stefan M.",
      relation: "Student FON-a, bivši učenik",
    },
    {
      quote:
        "Sjajan rad sa mojom decom — strpljiv, dobro pripremljen, i ono što mi se najviše sviđa: prilagođava tempo deci. Topla preporuka.",
      author: "Ana K.",
      relation: "Roditelj dvoje učenika",
    },
    {
      quote:
        "Najbolji profesor matematike koga sam imala. Sa njim mi je matematika postala omiljen predmet.",
      author: "Jelena V.",
      relation: "Učenica gimnazije",
    },
  ],
  intro_video_url: null, // user can add later
};

async function main() {
  const cs = process.env.SUPABASE_CONNECTION_STRING;
  if (!cs) {
    console.error("Missing SUPABASE_CONNECTION_STRING");
    process.exit(1);
  }
  const client = new Client({ connectionString: cs });
  await client.connect();

  // Find org via auth.users → public.users.
  const { rows: userRows } = await client.query(
    `select pu.organization_id, pu.full_name, pu.email
       from public.users pu
       join auth.users au on au.id = pu.id
      where au.email = $1
      limit 1`,
    [TARGET_EMAIL],
  );
  if (userRows.length === 0) {
    console.error(`No user found with email ${TARGET_EMAIL}`);
    process.exit(1);
  }
  const orgId = userRows[0].organization_id as string;
  console.log(`Found org: ${orgId} (${userRows[0].full_name})`);

  // Existing slug if any.
  const { rows: existing } = await client.query(
    "select slug from public.public_profiles where organization_id = $1",
    [orgId],
  );
  const slug = existing[0]?.slug ?? "milan-julinac";

  await client.query(
    `insert into public.public_profiles (
       organization_id, slug, display_name, bio,
       subjects, levels, specialties, formats, languages,
       years_experience, price_range_text, location,
       contact_email, available_for_new_students, published,
       links, qualifications, experiences, testimonials,
       intro_video_url
     ) values (
       $1, $2, $3, $4,
       $5, $6, $7, $8, $9,
       $10, $11, $12,
       $13, $14, $15,
       $16, $17, $18, $19,
       $20
     )
     on conflict (organization_id) do update set
       slug = excluded.slug,
       display_name = excluded.display_name,
       bio = excluded.bio,
       subjects = excluded.subjects,
       levels = excluded.levels,
       specialties = excluded.specialties,
       formats = excluded.formats,
       languages = excluded.languages,
       years_experience = excluded.years_experience,
       price_range_text = excluded.price_range_text,
       location = excluded.location,
       contact_email = excluded.contact_email,
       available_for_new_students = excluded.available_for_new_students,
       published = excluded.published,
       links = excluded.links,
       qualifications = excluded.qualifications,
       experiences = excluded.experiences,
       testimonials = excluded.testimonials,
       intro_video_url = excluded.intro_video_url`,
    [
      orgId,
      slug,
      profileData.display_name,
      profileData.bio,
      profileData.subjects,
      profileData.levels,
      profileData.specialties,
      profileData.formats,
      profileData.languages,
      profileData.years_experience,
      profileData.price_range_text,
      profileData.location,
      profileData.contact_email,
      profileData.available_for_new_students,
      profileData.published,
      JSON.stringify(profileData.links),
      JSON.stringify(profileData.qualifications),
      JSON.stringify(profileData.experiences),
      JSON.stringify(profileData.testimonials),
      profileData.intro_video_url,
    ],
  );

  console.log(`✓ Profile seeded. Slug: /p/${slug}`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
