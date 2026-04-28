# Profesori

SaaS platforma za solo profesore privatnih časova u Srbiji. Učenici, raspored, naplata, AI generator zadataka i javni profil — sve na jednom mestu.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth)
- Anthropic Claude API (AI generator zadataka)
- Resend (email podsetnici i opomene)
- Hosting: Vercel

## Setup

```bash
npm install
cp .env.example .env.local
# popuni vrednosti u .env.local
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

## Struktura

```
src/
  app/             Next.js App Router rute
  components/ui/   shadcn komponente
  lib/
    supabase/      Supabase klijenti (browser, server, middleware)
    utils.ts       cn() i pomoćne funkcije
  middleware.ts    refresh Supabase sesije
```

## Napomena

Platforma služi za evidenciju duga i uplata između profesora i njegovih učenika. Sve novčane transakcije odvijaju se direktno između profesora i učenika. Platforma ne učestvuje u prenosu novca i nije platni servis.
