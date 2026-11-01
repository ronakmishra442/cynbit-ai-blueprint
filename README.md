<!-- This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. -->


# Cynbit AI Project Blueprint

A guided three-step inquiry flow for Cynbit's Contact page. Visitors get an instant project brief, and the Cynbit team gets structured leads with a Hot/Warm/Cold priority in a password-protected dashboard.

**Live:** https://cynbit-ai-blueprint.vercel.app
**Admin:** https://cynbit-ai-blueprint.vercel.app/admin (password on request)

## Features
- Three-step form (service, scope and timing, details) with zod validation in the browser and on the server
- Instant project brief after submission (LLM-generated when an API key works, otherwise a deterministic template)
- Rule-based lead scoring (budget, timeline, detail, company) with a one-line reason
- Leads stored in Supabase (Postgres) with row level security
- Admin dashboard with login, priority and status filters, and a new / contacted / closed workflow
- Rate limiting on the inquiry API and admin login

## Tech stack
Next.js 16 (App Router), TypeScript, Tailwind CSS, Zod, Supabase, Vercel.

## Run locally
```bash
git clone https://github.com/ronakmishra442/cynbit-ai-blueprint.git
cd cynbit-ai-blueprint
npm install
```

Create `.env.local` in the project root:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
# Optional: enables AI-generated briefs, otherwise the template is used
GEMINI_API_KEY=
```

Create the `leads` table in the Supabase SQL editor (see below), then:

```bash
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin.

## Database
```sql
create table public.leads (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  service text not null,
  industry text null,
  budget text not null,
  timeline text not null,
  name text not null,
  email text not null,
  company text null,
  description text not null,
  brief text not null,
  brief_source text not null default 'template'::text,
  status text not null default 'new'::text,
  priority text null,
  priority_reason text null,
  constraint leads_pkey primary key (id)
) TABLESPACE pg_default;

alter table public.leads enable row level security;
-- No public policies: only the server (service role key) can read or write.
```

## Lead scoring
Score out of 6: budget (0 to 2) + timeline (0 to 2) + description of 200+ characters (1) + company given (1). Hot at 4 or more, Warm at 2 or 3, Cold below 2.

## Known limitations
- The rate limiter is in memory, so limits are per serverless instance.
- Admin uses a single shared password.
- The deployed build uses the template brief. The LLM path is implemented with a fallback but is not enabled in production.