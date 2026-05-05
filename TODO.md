# TODO — AI generator zadataka + glasovne beleške profesora

Sve je commit-ovano i deploy-ovano, ali da feature radi u produkciji moraš da uradiš nekoliko manuelnih koraka. **Dok ne uradiš ove korake, `/exercises` i lesson dialog AI capture će padati.**

Test plan i checklist sa konkretnim koracima → `TESTING.txt` (taj fajl možeš da otvoriš sa bilo koje mašine, telefona, sveske).

---

## Šta je urađeno u sesiji 2026-05-05

Sve gurnuto na `main`, Vercel auto-deploy. Šest commita:

1. **`63e770a` — AI generator zadataka iz matematike**
   - Migracija 0019 (`exercise_sets`)
   - Sonnet 4.6 + Zod structured output + prompt caching
   - `/exercises` lista, `/exercises/new` wizard, `/exercises/[id]` detalj sa print verzijom (sa/bez rešenja)

2. **`e925d04` — Glasovne beleške posle časa**
   - Migracija 0020 (`progress_summary`, `voice_transcript_raw` na `lessons`)
   - OpenAI Whisper transkripcija → Claude cleanup u strukturisan draft
   - VoiceRecorder + AINoteCapture u lesson dialog-u
   - Dedikovana `/lessons/[id]/note` mobile-friendly stranica
   - Dashboard "Snimi za poslednji" CTA

3. **`6debf2a` — Nedeljni i mesečni izveštaji**
   - Migracija 0021 (students preferences + `report_logs` tabela)
   - Resend HTML email sa AI uvodnim paragrafom (3. lice za roditelja, 2. za učenika)
   - Student form: audience radio + email učenika + toggles
   - `/students/[id]` ReportsPanel sa preview/send/history
   - `/reports/[id]` snapshot route

4. **`bf24e44` — Browser print + WhatsApp share za izveštaje**
   - `/reports/[id]/print` auto-print route (Ctrl+P → Save as PDF)
   - WhatsApp share dugme u preview dialogu i istoriji
   - `AutoPrint`/`PrintButton` promovisani u shared `@/components/auto-print`

5. **`c2d0b24` — WhatsApp opomena + ponavljajući časovi**
   - Migracija 0022 (`whatsapp` kanal u `reminder_logs`)
   - WhatsApp dugme na prvom mestu u reminder dialog-u
   - Migracija 0023 (`recurrence_group_id` na `lessons`)
   - "Ponovi" UI u CreateForm (weekly/biweekly, 2-52 ponavljanja, conflict-skip)
   - "Obriši sve buduće u serijama" u EditForm

6. **`f47ae76` — Vercel Cron skeleton**
   - `vercel.json` sa Pon 07:00 UTC (weekly) i 1. u mesecu 07:00 UTC (monthly)
   - `/api/cron/reports` route sa `CRON_SECRET` bearer auth + idempotency check
   - **NIJE AKTIVAN dok ne testiraš manual flow 2-3 nedelje**

---

## ⚠️ Mora pre nego što feature počne da radi u prod

### 1. Migracije na produkcionoj bazi (Task #2, #8, #14, #22, #23)
- Fajlovi:
  - `supabase/migrations/0019_exercise_sets.sql` — tabela za AI generator zadataka
  - `supabase/migrations/0020_lesson_voice_notes.sql` — `progress_summary` + `voice_transcript_raw` na `lessons`
  - `supabase/migrations/0021_reports.sql` — students preferences + `report_logs` tabela
  - `supabase/migrations/0022_reminder_whatsapp.sql` — dodaje `'whatsapp'` kao validan kanal u `reminder_logs`
  - `supabase/migrations/0023_lesson_recurrence.sql` — `recurrence_group_id` na `lessons` za serije ponavljajućih časova
- Pokreni jedno od sledećeg:
  - Lokalno sa `SUPABASE_CONNECTION_STRING` u `.env.local` → `npm run db:migrate`
  - Ili kroz Supabase Dashboard → SQL Editor → paste-uj sadržaj migracije i Run
- Verifikuj: nove tabele (`exercise_sets`, `report_logs`) i nove kolone (`progress_summary`, `voice_transcript_raw`, `recurrence_group_id` na lessons; `student_email`, `report_audience`, weekly/monthly toggles na students) postoje

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

### 2b. CRON_SECRET za auto-slanje izveštaja (Task #27)
- Generiši random secret: `openssl rand -hex 32`
- Vercel Dashboard → Settings → Environment Variables → `CRON_SECRET=<hex>`
- Cron job-ovi su definisani u `vercel.json`:
  - **Pon 07:00 UTC** (08:00 zimi / 09:00 leti Belgrade) → nedeljni izveštaji
  - **1. u mesecu 07:00 UTC** → mesečni izveštaji
- Vercel automatski šalje `Authorization: Bearer <CRON_SECRET>` na cron pozive
- **PRE NEGO ŠTO PUSTIŠ CRON U PROD**: testiraj manual flow 1-2 nedelje. Bug u promptu = 50 frustriranih roditelja odjednom.
- Da privremeno ISKLJUČIŠ cron bez deletovanja config-a: ukloni `vercel.json` iz repoa ili promeni schedule na nešto u dalekoj budućnosti

### 2c. Manuelno testiranje cron rute pre aktivacije
- Lokalno (sa popunjenim env-om):
  ```bash
  curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/reports?kind=weekly
  ```
- Na prod-u:
  ```bash
  curl -H "Authorization: Bearer <CRON_SECRET>" https://tvoj-domen.com/api/cron/reports?kind=weekly
  ```
- Vraća JSON sa summary: `{ orgs_processed, students_total, sent, skipped_already_sent, skipped_no_email, failed, failures[] }`
- Idempotentno: druga (ista) cron invokacija ne šalje duplikate jer postoji unique index `report_logs_unique_period_idx`

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

### A — Quick wins (kod je jednostavan, ide odmah dok ne stigneš do glavne mašine)

1. **Browser print stranica za izveštaje** — `/reports/[id]/print` sa auto `window.print()`, isti pattern kao kod exercises. Profesor (i roditelj) može da napravi PDF preko browser print dialog-a (Ctrl+P → Save as PDF). 15 min posla.
2. **WhatsApp share dugme u ReportsPanel-u** — `wa.me/<phone>?text=...` link sa subject + kratki preview. Roditelj/učenik dobija poruku odmah na WhatsApp umesto/uz email. 15 min posla.

### B — Cron (sledeća iteracija, NE HITNO)

**Vercel Cron za auto-slanje izveštaja** — Pon 08:00 (nedeljni) + 1. u mesecu 08:00 (mesečni).

**Argumenti ZA:**
- Konzistentnost — roditelji se naviknu i tek tada feature ima retention efekat. Bez cron-a, profesor zaboravi da klikne, izveštaji prestaju da pristižu, feature se zaboravi.
- Marketing — "automatski svake nedelje, ne moraš ništa" je razlog zašto profesor obnovi pretplatu.
- Pretvara alat iz "moram da ga koristim" u "radi za mene".

**Argumenti PROTIV (zašto NE ODMAH):**
- Sadržaj još nije validiran u praksi. Cron šalje 50 mejlova odjednom — bug u promptu = 50 frustriranih roditelja.
- Edge case-ovi: idempotency (već imamo unique index `report_logs_unique_period_idx`), pauzirani učenici, prazni periodi, time zones. Sve rešivo, ali traži 2-3h pažnje.

**Plan kada krenemo:**
- `vercel.json` sa dva cron job-a
- API route `/api/cron/reports?kind=weekly|monthly` koji prolazi kroz sve org-ove → sve `active` učenike → proveri toggle (`weekly_reports_enabled` ili `monthly_reports_enabled`) → proveri da već nije poslat za taj period → generiše + šalje
- Auth: `CRON_SECRET` env var, svaki request od Vercel-a nosi taj header
- Smart skip: ako je u periodu 0 časova i nema dugovanja, NE šalji ništa (da ne spam-uje)

**Pre nego što ovo radimo**: 2-3 nedelje korišćenja manual flow-a, da vidiš da li je sadržaj OK i da li profesori uopšte koriste izveštaje.

### C — PDF za izveštaje (low ROI, samo ako profesor zatraži)

**Iskrena preporuka: NE radimo PDF attachment u emailu.**
- HTML email koji već imamo je za 95% slučajeva bolji od PDF-a (otvori-i-čitaj na telefonu vs download-otvori-čitaj).
- PDF prilozi pogoršavaju Resend deliverability (SPAM filteri).
- Server-side PDF u Vercel-u je nezgodan (`puppeteer` traži special chromium binary; `@react-pdf/renderer` znači potpuno drugi template = duplikacija HTML šablona).

**Što ćemo umesto toga uraditi (deo A iznad):** browser print rutu — pokriva use case "profesor želi PDF za arhivu" i "roditelj želi PDF da pokaže detetu na papiru".

**Ako baš zatraži neko**: server-side PDF preko `@react-pdf/renderer` je 2-dana posao i znači paralelan template (drugi renderer od HTML email-a).

### D — Druge stvari iz prvobitnog Tier 1/2

5. **Recurring časovi** — "Marko, ponedeljkom u 17h, do kraja semestra" → kreira sve odjednom. Pola dana posla, brutalno štedi vreme.
6. **Google Calendar sync** — read-only u prvi mah, da ne mora dvaput da unosi.
7. **Domaći zadaci sa tracking-om** — posle časa dodaj domaći, učenik/roditelj dobije link, profesor vidi ko je uradio.
