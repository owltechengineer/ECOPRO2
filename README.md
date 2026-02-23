# ECOPRO2

Piattaforma multi-attività per founder: dashboard, progetti, task, finance e simulazioni forecast. Integrazione Supabase (PostgreSQL).

## Stack

- **Next.js 15** (App Router)
- **React** + **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth, PostgreSQL, Storage)
- **Zustand** (state + persist)
- **Recharts** (grafici)

## Setup

```bash
npm install
cp .env.local.example .env.local
# Compila .env.local con le chiavi Supabase (vedi sotto)
npm run dev
```

### Variabili ambiente

| Variabile | Descrizione |
|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave anon (pubblica) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chiave service_role (solo server, mai esporre) |

Le chiavi si trovano in Supabase → Settings → API.

### Database

1. Esegui `supabase/migrations/001_initial_schema.sql` nel SQL Editor
2. Esegui `supabase/migrations/002_personal_setup.sql` (disabilita RLS, user_id nullable)
3. (Opzionale) Esegui `supabase/seed.sql` per dati demo

## Script

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Dev server (localhost:3000) |
| `npm run build` | Build produzione |
| `npm run start` | Avvia build produzione |

## Struttura

```
src/
├── actions/          # Server actions (Supabase)
├── app/              # App Router pages
├── components/       # UI, forms, dashboard
├── hooks/            # useActivity, useCrud
├── lib/supabase/     # Client, server, admin
├── store/            # Zustand
└── types/            # TypeScript types
supabase/
├── migrations/       # SQL schema
└── seed.sql         # Dati demo
```

## .gitignore

Ignorati: `.next/`, `node_modules/`, `.env.local`, `dist/`, `.DS_Store`, `*.log`, `supabase/.branches/`, `supabase/.temp/`.

Il file `.env.local.example` è tracciato come template (senza segreti).

## Push / Git

Vedi [docs/PUSH.md](docs/PUSH.md) per istruzioni su remote, branch e push.
