# Profesori — pitch dokument

**Verzija:** 2026-05-08
**Cilj dokumenta:** referenca za razgovor sa profesorima — šta app radi, koje
bolne tačke rešava, kako izgleda tipičan tok korišćenja.

---

## TL;DR

> "Sve što jednom solo profesoru treba da prestane da gubi vreme na admin —
> raspored, beleške, izveštaji za roditelje, AI generator zadataka, domaći
> zadaci, naplatu — u jednoj aplikaciji na srpskom. Plus moderni AI
> alati koji ti šalju izveštaje za 30 sekundi umesto 30 minuta kucanja."

---

## Bolne tačke koje rešavamo

Tipičan solo profesor sa 15-25 učenika:

| Bol | Koliko vremena nedeljno |
| --- | ----------------------- |
| Kalendar i podsetnici po WhatsApp-u, Excel za naplatu | 1-2h |
| Pisanje izveštaja roditelju po WhatsApp-u | 2-3h |
| Priprema zadataka za sledeći čas | 2-4h |
| Praćenje "ko je platio, ko nije" | 30-60 min |
| Beleške nakon časa (sveska + WhatsApp) | 1-2h |
| Komunikacija oko domaćih (foto sveske preko WA) | 1h |
| **Ukupno** | **8-13h nedeljno** |

App svodi to na **2-4h nedeljno** — ostatak se automatizuje ili AI-asistira.

---

## Šta sve app radi

### 1. Učenici i raspored

- CRUD učenika sa svim potrebnim informacijama (razred, cena po času,
  trajanje, kontakti roditelja)
- Statusi: aktivan / pauziran / arhiviran
- Kalendar (nedeljni + mesečni pregled)
- Pojedinačni časovi i **recurring serije** ("ponedeljkom u 17h, 8 puta")
  — sve odjednom + automatska conflict detection
- "Obriši sve buduće u seriji" jednim klikom

### 2. Beleške posle časa — glasovne ili otkucane

- Otvori čas u rasporedu → snimi 30-60 sekundi šta ste radili
- AI Whisper transkriptuje + Claude strukturira u draft:
  - notes_after_lesson (slobodne beleške)
  - topics_covered (tagovi tema)
  - lesson_rating (1-5)
  - progress_summary (rezime za izveštaj roditelju)
  - next_lesson_plan (plan za sledeći put)
- Radi i sa mobilnog mikrofona u browseru, na srpskom
- Otkucaj fallback ako profesor ne želi glas

### 3. AI predlog teme za sledeći čas

- Otvoriš formu za novi čas učenika
- Klikneš "Generiši AI plan"
- AI gleda zadnjih 5 časova sa beleškama, predlaže:
  - Konkretnu temu (npr. "Tekstualni zadaci sa kvadratnom formulom")
  - Obrazloženje sa stvarnim referencama na pattern greške i prošlu
    progresiju ("Marko greši u predznaku 4ac sedmi put zaredom")

### 4. AI generator zadataka

- Wizard: predmet, razred, tema, težina, broj zadataka, opciono napomena
- **5 predmeta**: matematika, fizika, hemija, srpski, engleski
- Sonnet 4.6 generiše setove sa pitanjem + rešenjem + postupkom
- **KaTeX rendering** — pravi razlomci, koreni, kvadratna formula,
  matrice, sve standardno; štampa lepo u PDF
- Preview pre snimanja, "Sačuvaj u banku"
- Štampa sa rešenjima ili bez (auto print dialog za save-as-PDF)
- Banka se gradi vremenom — "imam već 50 setova kvadratnih za 8. razred"

### 5. Nedeljni i mesečni izveštaji za roditelje

- Period boundaries: nedeljni Pon-Ned, mesečni 1.-poslednji
- AI uvodni paragraf na osnovu zaprema beleški iz perioda:
  - 3. lice za roditelja, 2. lice za odraslog učenika
  - Konkretan luk perioda ("od muke sa formulom stigao do samostalnog rešavanja")
  - Citira specifične detalje, ne floskule
- Statistika (časovi, minuti, prosečna ocena)
- Per-čas breakdown sa progress_summary
- AI sažet "Šta sledi" za sledeći period
- Naplata blok (dug / pretplata)
- Domaći blok (zadato X, predato Y)
- HTML email + plain text fallback
- **Keširanje + regeneracija**: Pregled prvi put generiše + sačuva draft;
  drugi klik vraća isti bez novog AI poziva. "Regeneriši" pravi novu
  verziju ako su se beleške promenile.
- "Pošalji" → Resend email (ili WhatsApp share link kao alternativa)

### 6. Domaći zadaci sa public linkom

- U lesson dialog-u "Domaći za sledeći put" sekcija
- Profesor unosi naslov, opis, rok
- Generiše se javni link `/h/[token]` (32-hex)
- WhatsApp share dugme + Email + Kopiraj link
- Roditelj/učenik klikne link (bez login-a):
  - Vidi šta je domaći, rok, eventualno vezani exercise set (BEZ rešenja)
  - **Upload slika sveske** (mobile capture direktno otvara kameru)
  - Komentar opcioni
  - Klikne "Uradio sam"
- Profesor vidi predaje na profil učenika — slike, komentar, status
- Status: zadat → predat → ocenjen
- Profesor ocenjuje (1-5) + feedback
- Domaći se prikazuje u nedeljnom/mesečnom izveštaju ("zadato 3, predato 2")

### 7. Naplata (evidencija, NE kolekcija)

- Profesor unosi: "Marko platio 6,000 keš, 12. oktobra"
- App tracking-uje: ko duguje, ko je platio, koliko, kada
- **Mi NE diramo finansijski tok** — sve je gotovinski između profesora
  i roditelja, mi ne integrišemo Stripe/PSP
- Multi-channel opomene (WhatsApp, Viber, SMS, Email) — generiše tekst
  iz šablona, otvara native razgovor
- Istorija svih opomena

### 8. Dokumenti — mesečni računčić + godišnji dnevnik

- Na profilu učenika "Dokumenti" dropdown
- **Mesečni računčić**: list časova + uplate u tom mesecu, trenutno stanje,
  potpis profesora, disclaimer da nije fiskalni račun
- **Godišnji dnevnik**: kompletna istorija godine — stat strip, top 20
  tema sa frekvencijom, per-mesec breakdown, svi domaći zadaci,
  potpis + datum generisanja
- Print-ready, Ctrl+P → Save as PDF, šalje se WhatsApp-om ručno

### 9. Bulk poruke

- Sidebar nav "Poruke"
- Pick recipients (svi aktivni učenici default-no)
- Šabloni: pauza časova, pomeranje, podsetnik, praznici
- Variable interpolation: `{ime}`, `{ime_roditelja}`
- Live preview prve poruke
- Kanal: WhatsApp ili Email (mailto)
- "Otvori N tabova" jednim klikom — svaki recipient u svom tab-u sa
  prefilled tekstom

### 10. AI parser poruka od roditelja

- `/poruke/parser`
- Profesor paste-uje sirov tekst poruke (kopiran iz WhatsApp/SMS/email)
- AI razume:
  - **Intent**: pomeranje termina, otkaz, pohvala, pitanje, žalba, drugo
  - **Match učenika** sa profesorovog spiska (ako je pomenut)
  - **Datum/vreme** ako je pomenut
  - **Sažetak** šta roditelj traži/javlja
  - **Predlog akcije** za profesora
  - **Predlog odgovora** koji se kopira jednim klikom

### 11. Roditeljski portal (privatan link)

- Profesor klikne "Link za roditelja" na profilu učenika
- Generiše privatan link `/r/login/[32-hex-token]`
- Šalje preko WhatsApp/Email
- Roditelj klikne → automatski ulogovan (cookie, bez password-a)
- Portal `/r`:
  - Greeting (sa parent_name)
  - Stat strip za poslednjih 30 dana (časovi, minuti, domaći, dug)
  - Lista poslatih izveštaja sa expand-om za komentar
  - Lista domaćih zadataka (sa statusom)
- **Komentari na izveštaje**: roditelj klikne expand pored izveštaja,
  ostavi komentar, profesor vidi u app-u sa "Nepročitano" badge-om
- Portal ne traži login svaki put — cookie traje 1 godinu
- Profesor može da revoke-uje link i generiše nov

### 12. Onboarding tour (Webflow-style)

- Prvi put kad se profesor uloguje na `/dashboard` automatski kreće
  product tour
- Pop-over baloncići kače se na realne UI elemente
- 3 tour-a u "?" dropdown-u (uvek dostupan):
  - **Glavni tour** (8 koraka) — pregled cele aplikacije
  - **Raspored detaljno** (4 koraka)
  - **Izveštaji za roditelje** (4 koraka, navigira između /students i
    /students/[id] automatski)

### 13. Dashboard "Šta je app uradio za tebe"

- Widget na home strani
- Prati zadnjih 7 dana:
  - Koliko beleški sa časova upisano
  - Koliko glasovnih transkripcija
  - Koliko AI generisanih setova zadataka
  - Koliko izveštaja poslato
  - Koliko domaćih zadato + predato
- Heuristika za **vreme ušteđeno** (~5 min beleška, 15 min izveštaj,
  30 min set zadataka, itd.)
- Profesor vidi konkretan ROI po nedelji

---

## Tipičan tok kroz nedelju

**Ponedeljak ujutru:**
- Profesor otvara dashboard, vidi: "3 domaća čekaju pregled"
- Klik → ocenjuje, ostavlja feedback, status="ocenjeno"

**Pre svakog časa:**
- Otvara čas u rasporedu
- Klik "Generiši AI plan" → vidi: _"Marko greši u predznaku 4ac sedmi
  put. Predlažem fokus na to + str. 163 zad. 6 za pripremu kontrolne."_
- Sledi predlog ili modifikuje

**Posle časa:**
- Otvara čas, snima 45 sekundi: _"Marko je danas konačno uhvatio predznak,
  treća jednačina mu nije bila problem. Domaći — str. 165 zad. 1-5."_
- AI strukturira u draft, profesor pregleda i potvrdi
- Sekcija "Domaći za sledeći put" — unosi rok, klik "Sačuvaj"
- WhatsApp dugme → otvara razgovor sa roditeljem sa prefilled link-om
  domaćeg

**Nedelja uveče:**
- Idi na /students, izaberi Marka
- Klik "Pregled" na nedeljni izveštaj — AI generiše sa konkretnim luk-om
  iz progress_summary-ja
- Klik "Pošalji" — email roditelju, "Poslato" badge u istoriji

**Mesečni 1. u mesecu:**
- Klik "Dokumenti" → "Mesečni računčić — april" — otvara PDF stranicu
- Ctrl+P → Save as PDF
- Šalje WhatsApp-om roditelju

**Pre kontrolne:**
- Idi na /exercises/new
- "Matematika, 8. razred OŠ, kvadratne jednačine, srednje, 10 zadataka"
- 15 sekundi — set sa rešenjima i postupcima u banci
- Štampa bez rešenja → daje učeniku za vežbu

**Kad roditelj pošalje WhatsApp:**
- _"Pozdrav, da li bi mogao Markov utorak da bude u sredu? Imamo putovanje."_
- Profesor paste-uje u /poruke/parser
- AI: intent=reschedule, učenik=Marko, vreme=utorak, predlog akcije +
  predlog odgovora — kopiraj i pošalji

**Roditelj koristi portal:**
- Profesor je poslao link na WhatsApp jednom
- Roditelj klikne, vidi statistiku za zadnjih 30 dana, sve izveštaje,
  status domaćih
- Ostavlja komentar na izveštaj — profesor vidi u app-u

---

## Šta NE radimo (svesno)

- **Ne integrišemo Stripe/PSP** za plaćanje između profesora i roditelja
  — sve je gotovinski (na crno), mi smo samo evidencija
- **Ne pravimo fiskalne račune** — mi pravimo "računčiće" (interna
  evidencija), ne fiskalne dokumente
- **Ne radimo grupne časove** (na roadmap-u, ali ne MVP)
- **Ne radimo online whiteboard** za online časove (out of scope)
- **Ne hvatamo screenshot-e poruka** — paste tekst, ne sliku (jer OCR
  je dodatna komplikacija)
- **Ne tražimo registraciju kao preduzetnika** — app je za sve, bez
  obzira na pravni status profesora

---

## Tehničke karakteristike (za šanken-pitch)

- Hostovano na Vercel-u, Supabase Postgres baza
- Anthropic Claude Sonnet 4.6 sa Haiku 4.5 fallback-om za preopterećenje
- KaTeX rendering za math/fizika formule (lepo u browseru i PDF-u)
- Whisper za glasovnu transkripciju
- Resend za email-ove
- Multi-tenancy preko `organization_id` — svaki profesor svoja izolovana
  baza podataka
- 32 migracije, RLS policies, soft delete svuda

---

## Cena (TBD — preporuka iz strategije)

- **Free zauvek**: do 10 učenika, kalendar/naplata/beleške ručno, BEZ AI
- **Pro 990 RSD/mes**: neograničeno + AI feature-i
- **60 dana FULL free trial** prvi put (build the habit + the data)

ROI argument: pretplata = manje od pola časa mesečno; vreme ušteđeno
~3-4h nedeljno = ~5,000 RSD vrednosti po profesoru.

---

## Šta dolazi sledeće (roadmap)

**Tier 1 (sledeći krug):**
- Onboarding metrike (Plausible/PostHog)
- Srpski payment provider za pretplatu (NLB Pay / NestPay)
- 3-5 testimonijala stvarnih profesora
- Group lessons entity (2-4 učenika na 1 času)

**Tier 2 (3-6 meseci):**
- AI "asistent" chat sa tools — _"Koji su mi učenici imali pad ocene poslednja 3 meseca?"_
- Pripreme matura/prijemni progress tracker
- Lokalizacija na hrvatski/bosanski/crnogorski (1 dan posla)

**Tier 3 (kasnije):**
- Online whiteboard za online časove
- Auto-grade fotografisanog testa
- WhatsApp Business API native integracija

---

## Pitch one-liner

> "Profesori — sve što jednom solo profesoru u Srbiji treba da napreduje
> sa 5 na 30 učenika bez gubljenja sat vremena dnevno na administraciju.
> AI piše izveštaje, generiše zadatke, parsira WhatsApp poruke roditelja.
> Cena: manje od pola časa mesečno."
