# Luxe CRM — Clienteling for Swiss Watch Boutiques

A strict, high-discipline clienteling CRM built to the specification in `AGENT.md`. Replaces spreadsheets, WhatsApp memory, and notebooks with a single audited source of truth for high-touch luxury watch sales.

## Stack

- **Next.js 14** (App Router, Server Actions, Server Components)
- **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Prisma ORM** with **MySQL** as the sole supported engine
- **Tailwind CSS** (custom ink/bone/gold palette, Cormorant Garamond + Inter)
- **Zod** end-to-end input validation
- **jose** for HS256 JWT sessions (httpOnly cookies)
- **bcryptjs** password hashing (cost 12)

## Project Layout

```
/app
  /(auth)/login           — Sign-in page + server action
  /(dashboard)
    /layout.tsx           — Chrome, nav, overdue badge, signed-in guard
    /manager              — Manager overview
    /associate            — Associate "My Day"
    /clients              — List, filters, new client, detail
    /tasks                — Operations queue with complete/cancel
    /pipeline             — Kanban-style board
    /templates            — Message templates (manager write, all read)
    /reports              — Manager performance reports
  /api                    — REST JSON routes
    /auth (login/logout/me)
    /users
    /clients (CRUD, activities, sales, stage, reassign)
    /tasks
    /templates (render included)
    /reports
    /jobs (SLA, stagnation, anniversary, service, dormant, all)

/modules                  — Thin domain facades used by UI + routes
/server
  /repositories           — Query builders (where clauses, pagination)
  /services               — Domain logic, transactions, audit writes
  /jobs                   — Automation engine
/lib
  /auth                   — Session JWT, password, page/API guards
  /db                     — Prisma singleton
  /validators             — Zod schemas for every domain
  /utils                  — cn, format, phone, diff, rateLimit
  /http                   — Route helpers, cron auth
  /constants.ts           — Pipeline ordering, stagnation table, SLA hours

/prisma
  schema.prisma           — 8 mandatory tables + indexes
  seed.ts                 — Boot users + messaging templates
```

## Non-Negotiable Rules Enforced

| Rule | Enforcement |
| --- | --- |
| No client without owner | `ownerId` non-null FK, validated on create, reassignment service-only |
| Audit every mutation | `writeAudit()` on every create/update/delete/assign/stage change/login/logout |
| Soft delete | `deletedAt` on users, clients, activities, tasks, sales, templates |
| Backend role enforcement | `requireUser`/`requireManager` in pages; `authedContext`/`managerContext` in API; associates restricted by `restrictToOwnerId` in repositories |
| No stage skipping | `canAdvanceWithoutSkip`; managers require explicit `force=true` to override |
| Stage change requires note | Zod `min(5)`, forced persistence in `pipeline_states.note` |
| Auto follow-up on stage change | `advanceStage` creates a `FOLLOW_UP` task in the same transaction |
| Messaging does not send | Only prepares a WhatsApp deep link + logs an `activity` |
| Server-side pagination | Every list endpoint goes through `toPagination()` with `pageSize ≤ 100` |
| Indexed search | Indexes on `clients(name, phone, ownerId, stage, tier, deletedAt, lastContactAt)`, `activities(clientId+occurredAt)`, `tasks(dueDate+status, assigneeId+status)`, `sales(associateId+purchaseDate)`, etc. |
| Input validation | Zod at the edge of every action and every route |
| Rate limiting | In-memory token bucket on login (10/min/IP) |

## Prerequisites

1. **Node.js** ≥ 20
2. **MySQL** ≥ 8 running locally or reachable by URL

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env and set DATABASE_URL, AUTH_SECRET (32+ chars), CRON_SECRET (16+ chars), STORE_NAME

# 3. Generate Prisma client + apply schema
npx prisma migrate dev --name init

# 4. Seed initial users and message templates
npm run db:seed

# 5. Run the app
npm run dev
```

The app is served on http://localhost:3000.

### Seeded accounts

Password for both is `ChangeMe!123` — change immediately in a real environment.

| Role | Email |
| --- | --- |
| Manager | manager@luxe.local |
| Associate | associate@luxe.local |

## Environment Variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection string. Required. |
| `AUTH_SECRET` | JWT signing secret. ≥ 32 chars. |
| `AUTH_SESSION_TTL` | Session lifetime in seconds. Default 43200 (12h). |
| `CRON_SECRET` | Shared secret for `X-Cron-Secret` on `/api/jobs/*`. ≥ 16 chars. |
| `STORE_NAME` | Injected as `{{store_name}}` in templates. |

## Automation (Cron)

All jobs are HTTP-triggered. Point your scheduler at these endpoints and include `X-Cron-Secret`:

| Endpoint | When to run | Behaviour |
| --- | --- | --- |
| `POST /api/jobs/sla-breach` | Hourly | Finds clients with no activity in the first 24 h, creates HIGH task + notifies managers |
| `POST /api/jobs/stagnation` | Daily | Detects per-stage inactivity using `STAGNATION_DAYS`, opens follow-up task |
| `POST /api/jobs/anniversary` | Daily | Creates birthday/anniversary greeting tasks |
| `POST /api/jobs/service` | Daily | Creates a service task exactly 5 years after a sale |
| `POST /api/jobs/dormant` | Daily | Re-engagement task for clients with > 30 days inactivity |
| `POST /api/jobs/all` | Daily | Runs all five in parallel |

Example (macOS `launchd`, cron, Vercel Cron, etc.):

```bash
curl -X POST -H "X-Cron-Secret: $CRON_SECRET" https://your-host/api/jobs/all
```

## Messaging Engine

The system never sends messages. It:

1. Loads the template
2. Injects only whitelisted variables (`client_name`, `associate_name`, `store_name`, `wishlist_item`)
3. Generates a `https://wa.me/<phone>?text=<encoded>` deep link
4. Logs the preparation as a `MESSAGE` activity and updates `lastContactAt`

Unknown variables are rejected at template creation time.

## API Surface

All routes require the `luxe_session` cookie except `/api/auth/login` and `/api/jobs/*` (cron-secret). Errors return:

```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "…" } }
```

Successful responses:

```json
{ "ok": true, "data": { … } }
```

Role boundaries:

- `POST /api/users` — manager only
- `POST /api/clients/:id/reassign` — manager only
- `POST /api/clients/:id/stage` with `force: true` — only honoured for managers
- `POST/PATCH/DELETE /api/templates[/:id]` — manager only
- `GET /api/clients` — associates only see their own

## Scripts

```
npm run dev           # Next dev server
npm run build         # prisma generate + next build
npm run start         # production server
npm run typecheck     # tsc --noEmit
npm run lint          # Next/ESLint
npm run db:migrate    # prisma migrate dev
npm run db:deploy     # prisma migrate deploy (production)
npm run db:studio     # Prisma Studio
npm run db:seed       # seed users + templates
```

## Security Notes

- JWTs are stored in httpOnly, SameSite=Lax cookies; `Secure` in production.
- `bcrypt` cost factor 12 for password hashing.
- Rate limiting is best-effort in-memory; for production behind multiple nodes, back it with Redis.
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers are set globally via `next.config.mjs`.
- All mutations run inside Prisma transactions that write to `audit_logs` in the same unit of work — there is no path that mutates business data without an audit row.

## What to verify after `npm install`

```bash
npm run typecheck
npm run lint
npm run build
```

Build requires a reachable MySQL only if you run migrations; `prisma generate` itself runs offline and is triggered by `postinstall`.
