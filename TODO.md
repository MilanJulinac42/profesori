# TODO — AI generator zadataka

Sve je commit-ovano i deploy-ovano, ali da feature radi u produkciji moraš da uradiš nekoliko manuelnih koraka. **Dok ne uradiš ove korake, `/exercises` stranica će padati.**

---

## ⚠️ Mora pre nego što feature počne da radi u prod

### 1. Migracija nove tabele `exercise_sets` (Task #2)
- Fajl: `supabase/migrations/0019_exercise_sets.sql`
- Pokreni jedno od sledećeg:
  - Lokalno sa `SUPABASE_CONNECTION_STRING` u `.env.local` → `npm run db:migrate`
  - Ili kroz Supabase Dashboard → SQL Editor → paste-uj sadržaj migracije i Run
- Verifikuj: tabela `public.exercise_sets` postoji sa RLS policy-jima (`exercise_sets select/insert/update own org`)

### 2. Anthropic API ključ u Vercel env vars (Task #1)
- Vercel Dashboard → projekat → Settings → Environment Variables
- Dodaj `ANTHROPIC_API_KEY=sk-ant-...`
- Apply za **Production** (i Preview ako koristiš)
- **Re-deploy** posle dodavanja (env vars ne primenjuju se na već deploy-ovane verzije)

---

## ✅ Testiranje (kad je gore gotovo)

### 3. End-to-end test (Task #5)
- Idi na `/exercises/new` u prod
- Parametri: "Kvadratne jednačine, 8. razred OŠ, srednje, 10 zadataka"
- Klikni "Generiši zadatke" → čekaj ~10-20s
- Proveri preview: zadaci čitki, rešenja tačna, postupci jasni
- "Sačuvaj u banku" → redirect na detail
- Štampa: "Štampaj (bez rešenja)" → otvara se native print dialog, sadržaj čist (bez sidebar-a)

### 4. Provera token usage-a (Task #3)
- U Supabase Table Editor → `exercise_sets`
- Pogledaj kolone `input_tokens`, `output_tokens`, `cache_read_tokens`
- Cilj: posle drugog generisanja, `cache_read_tokens` treba da bude > 0 (sistem prompt se kešira)
- Realna cena po setu: ~$0.025-0.04

---

## 🐛 Šta da pratiš u prvih par dana

### 5. Kvalitet zadataka (Task #3)
- Generiši po 1 set za svaki razred (5–8. OŠ + 1–4. SŠ + matura)
- Za svaki proveri:
  - Da li su brojevi razumni za uzrast?
  - Da li je rešenje matematički tačno?
  - Da li je postupak jasan?
- Ako Sonnet greši na bilo kojem razredu/temi → uključi adaptive thinking + `effort: high` u `src/lib/exercises/generate.ts`

### 6. UX feedback od profesora
- Da li je 10-20s wait OK ili predugačko?
- Da li su parametri dovoljni ili treba još (npr. predmet u smislu "algebra vs geometrija")?
- Da li je print izgled prihvatljiv?

---

## 📋 Šta NIJE urađeno (eksplicitno preskočeno za MVP)

- ❌ Limiti po pretplati — sad svi mogu da generišu neograničeno (token usage se trackuje u bazi za kasnije)
- ❌ Streaming odgovora — sinhroni request, spinner ~15s
- ❌ Pošalji zadatke učeniku/roditelju email-om — može u sledećoj iteraciji
- ❌ "Regeneriši slične" dugme — `prompt_used` je sačuvan u bazi pa se lako doda
- ❌ Drugi predmeti pored matematike — sistem prompt je optimizovan samo za matematiku

---

## 🚀 Sledeći prioriteti (sa Tier-a iz prvobitnog plana)

Po impact/effort:

1. **Mesečni izveštaj roditeljima** (auto PDF: pokrivene teme, broj časova, ocena, dug/uplate, sledeći planovi → email)
2. **WhatsApp/Viber link za opomene** — 80% komunikacije u Srbiji ide tuda, sad imaš samo email
3. **Recurring časovi** ("Marko, ponedeljkom u 17h, do kraja semestra" → kreira sve odjednom)
4. **Google Calendar sync** — read-only u prvi mah
