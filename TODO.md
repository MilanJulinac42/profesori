# TODO — AI generator zadataka + glasovne beleške profesora

Sve je commit-ovano i deploy-ovano, ali da feature radi u produkciji moraš da uradiš nekoliko manuelnih koraka. **Dok ne uradiš ove korake, `/exercises` i lesson dialog AI capture će padati.**

---

## ⚠️ Mora pre nego što feature počne da radi u prod

### 1. Migracije na produkcionoj bazi (Task #2, #8, #14)
- Fajlovi:
  - `supabase/migrations/0019_exercise_sets.sql` — tabela za AI generator zadataka
  - `supabase/migrations/0020_lesson_voice_notes.sql` — `progress_summary` + `voice_transcript_raw` na `lessons`
  - `supabase/migrations/0021_reports.sql` — students preferences (audience, student_email, weekly/monthly enabled) + `report_logs` tabela
- Pokreni jedno od sledećeg:
  - Lokalno sa `SUPABASE_CONNECTION_STRING` u `.env.local` → `npm run db:migrate`
  - Ili kroz Supabase Dashboard → SQL Editor → paste-uj sadržaj migracije i Run
- Verifikuj: `exercise_sets` i `report_logs` tabele postoje + nove kolone na `lessons` i `students`

### 2. API ključevi u Vercel env vars (Task #1, #7, #16)
- Vercel Dashboard → projekat → Settings → Environment Variables
- Dodaj:
  - `ANTHROPIC_API_KEY=sk-ant-...` (AI generator zadataka, AI cleanup beleški, AI uvod izveštaja)
  - `OPENAI_API_KEY=sk-...` (Whisper transkripcija glasovnih beleški)
  - `RESEND_API_KEY=re_...` (slanje izveštaja roditeljima/učenicima)
  - `RESEND_FROM_EMAIL='Profesori <reports@tvojdomen.com>'` (mora biti VERIFIKOVAN domen u Resend dashboard-u, ne `gmail.com` adresa)
- Apply za **Production** (i Preview ako koristiš)
- **Re-deploy** posle dodavanja

### 2a. Resend domen verifikacija
- Resend Dashboard → Domains → Add Domain → unesi domen koji koristiš
- Dodaj DNS record-e (TXT, CNAME, MX) u domen registrara
- Sačekaj verifikaciju (~5min do par sati)
- Tek tada `RESEND_FROM_EMAIL` može da koristi taj domen

---

## ✅ Testiranje (kad je gore gotovo)

### 3. End-to-end test generatora zadataka (Task #5)
- Idi na `/exercises/new` u prod
- Parametri: "Kvadratne jednačine, 8. razred OŠ, srednje, 10 zadataka"
- Klikni "Generiši zadatke" → čekaj ~10-20s
- Proveri preview: zadaci čitki, rešenja tačna, postupci jasni
- "Sačuvaj u banku" → redirect na detail
- Štampa: "Štampaj (bez rešenja)" → otvara se native print dialog, sadržaj čist (bez sidebar-a)

### 3a. End-to-end test glasovnih beleški (Task #10–13)
- Otvori postojeći održan čas (Schedule → klik na čas) ili dashboard ima "Snimi za poslednji" CTA
- **Snimi**: klikni "Snimi belešku" → dozvoli mikrofon → govori 30-60s na srpskom o času
- Posle stop-a: sačekaj ~5-10s da Whisper transkriptuje + Claude strukturira
- Provera: forma se popunila — `notes_after_lesson`, `progress_summary`, `topics_covered`, `next_lesson_plan`, ocena
- Editiraj ako treba → "Sačuvaj"
- **Otkucaj fallback**: tab "Otkucaj" → ukucaj 1-2 rečenice → "Strukturiraj" → forma se popuni
- iOS Safari posebno proveri (codec je `audio/mp4` umesto `webm`) — Whisper to prima bez problema

### 3b. End-to-end test izveštaja (Task #14–19)
- Otvori učenika sa nekoliko održanih časova koji imaju `progress_summary` (testiraj 3a prvo da popuniš podatke)
- Na profilu učenika je sad sekcija **"Izveštaji"** sa CTA dugmićima
- **Pre prvog slanja**: idi na "izmeni profil" → odluči publiku (roditelj ili sam učenik) → ako je odrasla osoba, dodaj `student_email`; ako je dete, ostavi default i dodaj `parent_email`
- **Pregled**: klik "Pregled" za nedeljni → otvara dialog sa iframe-om i HTML preview-om → klik "Pošalji" iz dialoga ili iz panela
- Provera: stigne email na pravu adresu, vidi se sekcija u istoriji ("Poslato", timestamp, recipient)
- Klik na "oko" ikonu pored stavke → otvara `/reports/[id]` snapshot
- **Edge case bez podataka**: učenik bez ijednog časa u periodu → AI uvod kaže "Ove nedelje nije bilo časova" (bez troška Claude poziva)

### 4. Provera token usage-a (Task #3)
- U Supabase Table Editor → `exercise_sets`
- Pogledaj kolone `input_tokens`, `output_tokens`, `cache_read_tokens`
- Cilj: posle drugog generisanja, `cache_read_tokens` treba da bude > 0 (sistem prompt se kešira)
- Realna cena po setu: ~$0.025-0.04

### 4a. Cena glasovnih beleški
- Whisper (`gpt-4o-mini-transcribe`): ~$0.006/min audio → ~$0.012 za 2-min belešku
- Claude cleanup: ~$0.005 po belešci (sistem prompt cache-uje sa `cache_control: ephemeral`)
- Ukupno: ~**$0.02 po času**. Za profesora sa 30 časova/nedelja → ~$2.4/mesec u API cost-u

### 4b. Cena izveštaja
- Claude Sonnet 4.6 piše SAMO uvodni paragraf (~400 max_tokens, low effort): ~**$0.005 po izveštaju**
- Resend free tier: 3000 email-ova/mesec — pokriva i veliku bazu profesora
- Ako je period prazan (0 časova), AI poziv se preskače — vraća statičan tekst

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

**Generator zadataka:**
- ❌ Limiti po pretplati — svi mogu neograničeno (token usage trackuje se u bazi)
- ❌ Streaming odgovora — sinhroni request, spinner ~15s
- ❌ Pošalji zadatke učeniku/roditelju email-om
- ❌ "Regeneriši slične" dugme — `prompt_used` je sačuvan pa se lako doda
- ❌ Drugi predmeti pored matematike

**Glasovne beleške:**
- ❌ Audio fajl se NE čuva (po dogovoru) — samo transkript ostaje u `voice_transcript_raw`
- ❌ Dvojezično — sad samo srpski (Whisper hint `language: "sr"`)
- ❌ Background upload / retry — ako padne mreža tokom upload-a, profesor mora ponovo da snimi
- ❌ Limiti — bez ikakvog rate limiting-a, paziti na potrošnju OpenAI/Anthropic kvote

---

## 🚀 Sledeći prioriteti (sa Tier-a iz prvobitnog plana)

Po impact/effort:

1. **Vercel Cron za auto-slanje izveštaja** — Pon 08:00 (nedeljni) + 1. u mesecu 08:00 (mesečni). Manual trigger već radi, sad treba samo automatski feed.
2. **WhatsApp/Viber link za opomene + share izveštaja** — 80% komunikacije u Srbiji ide tuda. Sad imamo subject+html, lako dodajemo "Podeli WhatsApp-om" dugme.
3. **Recurring časovi** ("Marko, ponedeljkom u 17h, do kraja semestra" → kreira sve odjednom)
4. **Google Calendar sync** — read-only u prvi mah
