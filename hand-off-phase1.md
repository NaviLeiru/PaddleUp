# Phase 1 Handoff — Foundation

Status: **done**. Project skeleton, DB schema, and auth are live against a real Supabase database.

## What's built

**Stack scaffolding**
- Next.js 15 (App Router) + TypeScript, Tailwind CSS, shadcn-style base components
- Config: [tailwind.config.ts](tailwind.config.ts), [components.json](components.json), [tsconfig.json](tsconfig.json)
- Base UI components: [src/components/ui/](src/components/ui/) — `button`, `input`, `label`, `card`

**Database (Prisma → Supabase Postgres)**
- Full schema: [prisma/schema.prisma](prisma/schema.prisma)
  - `User` (role: `PLAYER` | `COURT_OWNER`)
  - `Facility` (single fixed record)
  - `Court` (belongs to Facility)
  - `AvailabilitySchedule` (belongs to Court)
  - `MaintenanceBlock` (belongs to Court)
  - `Booking` (belongs to User + Court; status: `PENDING_PAYMENT → PENDING_CONFIRMATION → CONFIRMED → CANCELLED`)
- Migration applied: `prisma/migrations/20260702080536_init`
- Prisma client singleton: [src/lib/prisma.ts](src/lib/prisma.ts)
- Seed script: [prisma/seed.ts](prisma/seed.ts) — creates the one Court Owner + the one Facility

**Auth (NextAuth v5, credentials + JWT sessions)**
- Split config to keep middleware Edge-safe:
  - [src/auth.config.ts](src/auth.config.ts) — Edge-safe (no bcrypt/Prisma), used by middleware
  - [src/auth.ts](src/auth.ts) — full config with Credentials provider + Prisma lookup, used by API routes
- Register API (Player self-signup only, Owner is seed-only): [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts)
- NextAuth route handler: [src/app/api/auth/[...nextauth]/route.ts](<src/app/api/auth/[...nextauth]/route.ts>)
- Login/Register pages: [src/app/(auth)/login/page.tsx](<src/app/(auth)/login/page.tsx>), [src/app/(auth)/register/page.tsx](<src/app/(auth)/register/page.tsx>)
- Role-based middleware: [src/middleware.ts](src/middleware.ts) — guards `/owner/*`, `/reservations/*`, and matching `/api/*` prefixes, redirects to `/login` if unauthenticated, redirects to `/` if wrong role
- Session type augmentation: [src/types/next-auth.d.ts](src/types/next-auth.d.ts)

## Environment variables

See [.env.example](.env.example) for the full list. Required to run:

| Var | Notes |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler**, port 6543, `?pgbouncer=true` |
| `DIRECT_URL` | Supabase **session pooler**, port 5432 — used by `prisma migrate` |
| `NEXTAUTH_SECRET` | random 32-byte base64, generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | `http://localhost:3000` in dev |
| `OWNER_EMAIL` / `OWNER_PASSWORD` / `OWNER_NAME` | used only by `prisma/seed.ts` |
| `FACILITY_NAME` | used only by `prisma/seed.ts` |

## Known gotchas hit during setup

1. **Direct DB host is IPv6-only.** `db.<project-ref>.supabase.co` resolves to an IPv6-only address; if the dev machine has no IPv6 route, `prisma migrate` fails with `P1001`. Fix: use the **pooler** host (`aws-*.pooler.supabase.com`) for both `DATABASE_URL` and `DIRECT_URL`, not the raw `db.*.supabase.co` host.
2. **URL-encode the DB password.** If the Supabase password contains `@`, it must be `%40` in the connection string or the URL parser breaks silently (auth failure, not a clear error).
3. **Middleware bundle bloat.** Importing `@/auth` (which pulls in bcryptjs + Prisma) directly into `middleware.ts` triggers Next.js "Node API not supported in Edge Runtime" warnings and bloats the middleware bundle. Fixed by splitting into `auth.config.ts` (Edge-safe, empty providers) + `auth.ts` (full config, Node-only). Middleware builds its own lightweight `NextAuth(authConfig)` instance.
4. **Owner account seeded with placeholder creds.** `owner@paddleup.test` / `change-me` unless `OWNER_EMAIL`/`OWNER_PASSWORD` were overridden before seeding — rotate before any real usage.

## Current git state

`origin` remote points to `NaviLeiru/PaddleUp` — the logged-in GitHub account does not have push access there. Unresolved; options are fork, get added as collaborator, or repoint `origin` to a repo you own. No changes have been pushed yet.

## How to run

```bash
npm install
npx prisma migrate dev   # applies schema, needs DATABASE_URL + DIRECT_URL in .env
npm run db:seed          # creates the one Court Owner + one Facility
npm run dev
```

## Not built (Phase 2+)

- Facility/Court CRUD UI and API (Phase 2)
- Public court browsing/search (Phase 3)
- Availability computation engine (Phase 4)
- Booking flow, receipt upload (Phase 5)
- Owner dashboard (Phase 6)
- Email notifications (Phase 7)
- Player reservation management UI (Phase 8)
- Polish/launch hardening (Phase 9)

See [plan.md](plan.md) for full phase breakdown.
