# Profesori — Strategija proizvoda

**Datum:** 2026-05-06
**Autor:** Sesija analize sa Claude

Ovaj dokument sadrži pošten pogled na proizvod (Profesori SaaS za solo tutore u
Srbiji), tržište, konkurenciju, cenu, i prioritetan roadmap za sledeća 2-3
meseca.

---

## 1. Trenutno stanje (šta već imamo)

Implementirane feature:

- **Učenici i raspored** — CRUD, statusi, recurring časovi
- **Beleške posle časa** — text + glasovne preko Whisper, AI strukturira
  draft (notes, topics, plan, ocena, progress_summary)
- **AI generator zadataka** — Sonnet 4.6, Zod structured output, KaTeX
  rendering za matematiku, štampa sa/bez rešenja
- **Naplata** — dug/uplata tracking, opomene preko Email/SMS/Viber/WhatsApp
- **Nedeljni i mesečni izveštaji** — Resend HTML email, AI uvod (3. lice za
  roditelja, 2. za odraslog učenika), keširanje draft-ova, regeneracija
- **Domaći zadaci** — public link za roditelja/učenika, upload slika sveske,
  status tracking, integracija u izveštaj
- **Public profile + booking** — javni link profesora sa zahtevima za nove
  učenike
- **WhatsApp share** kroz cele aplikacije (jeftin substitut za WhatsApp
  Business API)
- **Vercel cron skeleton** za auto-slanje izveštaja (NIJE aktiviran dok se
  manual flow ne validira)

---

## 2. Tržište

### TAM (Total Addressable Market) u Srbiji

Realna procena ~5,000 aktivnih solo tutora u Srbiji. Konvertibilan TAM
~1,500-2,000 (oni koji su digital-comfortable). Realan plan godinu dana
**200-300 paying korisnika** + regija (BiH, Hrvatska, Crna Gora).

### Segmentacija (ko će koristiti)

**Will use (30-40% solo profesora):**

- Mlađi tutori (do 40), digital natives
- Oni koji već koriste Google Calendar / Notion za posao
- Oni koji rade pripreme za maturu/prijemni — strukturisan progress tracking
  je tu ključan
- Oni sa 15+ učenika kojima je papir postao previše

**Won't use (50%+):**

- Stariji profesori sa decenijskim papirnim workflow-om
- Oni sa 3-5 učenika — premalo da im se isplati promeniti workflow
- Oni kojima je tutoring sporedan posao uz školu

---

## 3. Tržišna realnost — "na crno" pitanje

Većina solo tutora u Srbiji radi **bez prijave** (cash in hand, bez fakture
i poreza). Ovo direktno utiče na cenu koju mogu da naplatimo.

**Posledica:** SaaS od $20+/mes je no-go. Sweet spot je 990-1,890 RSD/mes
(8-16 €).

**Cenovna strategija:**

| Tier  | Cena/mes  | Limit                  | Cilj                                       |
| ----- | --------- | ---------------------- | ------------------------------------------ |
| Free  | 0 RSD     | 5 učenika              | Funnel — mora postojati                    |
| Start | 990 RSD   | 20 učenika             | Sweet spot za većinu                       |
| Pro   | 1,890 RSD | unlimited + AI features| Za one koji prave od ovoga primarni posao  |

**Pricing logic:**

- Profesor uzima 1500-3000 RSD po času. Pretplata je `<` 1 čas mesečno.
- Vrednost koju prodajemo: retention klijenata + ušteda 2-3h nedeljno + utisak
  profesionalizma koji opravdava podizanje cene časa za 200-300 RSD.
- Free tier obavezan da bi ušli u funnel; konverzija ka paid posle 1-2 meseca
  kada vide retention efekat.

---

## 4. Konkurencija

### Direktna (Srbija/Balkan)

- **Realno: nema specijalizovanog SaaS-a za solo tutore.**
- Postoje marketplace-i: Superprof, Maturski.net — **drugi model**, oni
  povezuju nove klijente, nisu CRM.
- Postoje školski softveri: Edly, ESchool — za institucije, nisu za solo.

### Globalno

- **TutorCruncher, TeachWorks, Oases** — sve $40-100/mes, nemaju srpski,
  nemaju AI generator zadataka, nemaju voice notes na srpskom.
- Direktna konkurencija je **stagnirajuća** (mali tim, fokus na engleski/USA
  market).

### Glavna stvarna konkurencija = trenutni workflow

- Google Calendar (free) za raspored
- WhatsApp grupa (free) za komunikaciju
- Excel za naplatu (free)
- Sveska za beleške (free)

**Naša prednost:** integrisano + AI + lokalizacija. Dovoljno za
diferencijaciju ali nije dovoljno za "wau" — zato treba nastavak.

---

## 5. WOW faktori (rangirani po ROI)

### Tier 1 — kratak posao, ogroman utisak

1. **AI predlaže šta sledeći put raditi**
   - Već imamo `progress_summary` u bazi. AI gleda poslednje 3-4 beleške i
     predlaže temu za sledeći čas.
   - U CreateForm-u za novi čas Marka: _"Predlažem rad na tekstualnim
     zadacima jer je prošli put zapeo na identifikaciji nepoznatih"_.
   - **Posao:** 2-3h. **Wow:** ogroman.

2. **Mesečni "računčić" za roditelja**
   - Lep PDF: _"Marko Petrović, oktobar 2024 — 8 časova × 1,500 = 12,000 RSD.
     Plaćeno: 9,000. Dug: 3,000."_
   - Email-uje se 1. u mesecu automatski.
   - Nije zvanična faktura (sve je na crno), nije ni faktura, ali je
     **profesionalniji utisak** od WhatsApp poruke "ovaj mesec mi dugujete 3000".
   - **Posao:** 4-5h.

3. **Bulk slanje poruka**
   - _"Časovi pauziraju do 8.1, javiću novi raspored"_ svim aktivnim
     učenicima jednim klikom.
   - Trenutno profesor kuca 25 puta istu poruku po WhatsApp-u. Brojevi su
     već u sistemu.
   - **Posao:** 3-4h.

4. **AI parsira poruke od roditelja**
   - Profesor paste-uje WhatsApp screenshot, AI ekstrahuje _"Marko ne može
     u sredu, traži pomeranje"_ i predlaže akciju (otkaži, predloži drugi
     termin).
   - **Posao:** 4h. **Wow:** real "asistent" feel.

### Tier 2 — veći posao, srednji utisak

5. **Roditeljski portal** (magic-link login)
   - Roditelj može da vidi statistiku, plaća, traži novi termin.
   - **Otključava** roditelja kao aktivnog korisnika, ne samo passive
     primaoca izveštaja.
   - **Posao:** 2-3 dana. Transformiše SaaS — više nije samo profesorska
     alatka.

6. **Group lessons**
   - Entity gde je 2-4 učenika na istom času, jedna cena, jedan zapis ali
     per-student progress notes.
   - Tržište solo profesora koji rade grupne ~30%.
   - **Posao:** 2 dana.

7. **AI "asistent" chat**
   - Profesor kuca _"Koji su mi učenici imali pad ocene poslednja 3 meseca?"_
     i dobija odgovor.
   - Tools-koji-pozivaju-naše-queries flow (Anthropic tool use).
   - **Posao:** 3-5 dana. True differentiator vs konkurencija.

8. **Pripreme matura/prijemni progress tracker**
   - Specijalan dashboard sa procentnim napretkom kroz oblasti, planom
     učenja, dijagnostičkim testom.
   - Ova niša plaća više i ima jaku market potrebu.
   - **Posao:** 1 nedelja.

### Tier 3 — kompleksno, nice-to-have

9. **Online whiteboard za online časove** — Excalidraw embed + sync.
10. **Auto-grade fotografisanog testa** — student slika rezultate, AI ocenjuje.
    Tehnički težak, ali "magic" feel.
11. **WhatsApp Business API integracija** — native slanje umesto
    `wa.me/?text=`. Skupo, regulatorni problemi, ali primary kanal u Srbiji.

---

## 6. Stvarni odgovori na ključna pitanja

**Q: Da li će profesori koristiti?**
A: Da, 30-40% solo profesora. Ostali su "stari kovači" i koriste papir
i WhatsApp do kraja.

**Q: Hoće li platiti?**
A:

- 5-15% bi platilo immediately (early adopters)
- 15-30% bi platilo posle 2-3 meseca free trial-a kad vide retention efekat
- 50%+ će ostati free zauvek

**Q: Koliko je realna konkurencija?**
A: U Srbiji praktično nikakva specijalizovana. Globalno postoji ali nemaju
srpski + AI + lokalizaciju. Glavna stvarna konkurencija = Google Calendar +
WhatsApp + Excel kombinacija.

---

## 7. Konkretan roadmap (sledeća 2 meseca)

**Tier 1 features po prioritetu:**

1. **AI predlaganje teme za sledeći čas** (Tier 1 #1) — minimalan posao,
   prikazuje "AI mind" pri svakom novom času
2. **Mesečni račun roditelju** (Tier 1 #2) — najveći retention impact
3. **Bulk poruke** (Tier 1 #3) — odmah primetan cost saving
4. **Public profile + booking link polish** — funnel za nove učenike

**Komercijalizacija (3-6 meseci):**

- Postaviti Free → Start gate na 5 učenika
- Pricing 990 / 1,890 RSD
- Još 1-2 meseca free trial za rane korisnike pa onda gate

**Pre nego što krene Tier 1 — VALIDACIJA:**

- **Pričaj sa 5-10 stvarnih profesora.** Lično, preko fakulteta, preko
  Linkedin-a. **Ne marketing prezentacija — pitaj kako rade danas.**
- Skroz će se otkriti šta je stvarno wow vs šta je nagađanje.
- Cilj: nađi 1-2 prava "early adopter" profesora koji će koristiti svaki
  dan i davati feedback.

---

## 8. Risk faktori

1. **Resend deliverability** — ako mejlovi padaju u SPAM, izveštaji ne
   funkcionišu. Mora SPF/DKIM/DMARC + warm-up domena.
2. **Anthropic 529 / cena** — već imamo retry + Haiku fallback, ali na 1000+
   korisnika cena $0.025 po setu zadataka × 50 sets/mes × 200 prof = $250/mes
   samo Anthropic. Treba Mixtral/Llama backup za free tier.
3. **WhatsApp blokada** `wa.me/?text=` — Meta povremeno menja API. Ako blok,
   moramo da pređemo na native Business API (skupo).
4. **GDPR + maloletna lica** — domaći zadaci sa slikama, izveštaji preko
   email-a. Treba consent flow i data retention policy.
5. **Supabase free tier limitations** — 500MB DB i 1GB storage. Sa 200 prof
   × 30 učenika × 4 domaća × 2 slike × 600KB ≈ 28 GB. Mora se preći na paid
   tier ($25/mes) brzo.

---

## 9. Šta radimo SLEDEĆE

Reci ti — ali iz ove liste, ako bi morao da biraš, najvrednije je:

1. **AI predlaganje teme** za sledeći čas (najbrži wow)
2. **Razgovor sa stvarnim korisnicima** pre nego što gradimo dalje (najveći
   risk reduction)

---

## Promene ovog dokumenta

- 2026-05-06: prva verzija, sesija analize sa Claude.
