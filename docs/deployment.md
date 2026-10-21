# Deployment

Today this repo **runs locally only** (dev-grade). This page documents what
exists, what the target deployment looks like, and the honest gaps between.

## Current state

- One deployable: `apps/gateway-api` (NestJS) + the web dashboard
  (`apps/web`, Next.js). Workers/services: none yet.
- `docker-compose.yml` provides **Postgres 16** and **Redis 7** (local
  Docker; not a deployment artifact). Postgres persists via a named volume;
  there is no managed-DB story, no MinIO/S3 for artifacts, no OTel collector.
- Migrations are applied from a dev shell (`pnpm db:migrate`), not from CI.
- Bootstrap notes (`main.ts`): helmet + HSTS, CORS from
  `CORS_ORIGIN_WHITELIST`/`CORS_ALLOW_METHODS` (empty = deny extra origins),
  global validation pipes, two-stage exception filters, graceful shutdown via
  SIGINT/SIGTERM hooks.

## Boot checklist (for a dev/staging box)

1. Postgres reachable; `DATABASE_URL` and `DATABASE_APP_URL` correct **and
   roles kept separate** (non-superuser runtime — RLS depends on it;
   `PostgresService` logs a boot warning otherwise).
2. Migrations applied: `pnpm db:migrate` (DDL role).
3. Redis reachable (`REDIS_URL`) — unused by the queue today, cheap to keep
   up for consistency.
4. `JWT_SECRET` strong and set; provider keys for Groq/Gemini present.
5. `pnpm run build` (turbo) then run API and web processes, or
   `nest start` in an app dir.

## Target deployment (what Plans.md expects)

Four deployables + infra:

| Deployable                  | Notes                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `gateway-api`               | Stateless HTTP surface; never executes tests in the target — enqueue + query only          |
| `apps/web`                  | Static/Node hosting for the dashboard                                                      |
| `runner-e2e` + `runner-api` | BullMQ workers: browser pool and HTTP-only pool. No inbound HTTP, output via Redis Streams |
| `ai-service`                | LLM gateway, budgets, caching, evals — behind `RecoveryPort`                               |
| `scheduler`                 | Cron/CI webhook fan-out                                                                    |

Infra baseline: Redis (BullMQ + Streams), S3/MinIO artifacts, OpenTelemetry,
managed Postgres with the same role split (owner for migrations,
`app_runtime` for everything else) and RLS policies intact.

Reality check: none of those workers exist yet ([../ROADMAP.md](../ROADMAP.md))
— the gateway's in-process run promise is the current execution engine, so
any "deploy the queue" plan is premature outside a dev machine.

## Things that change only _with_ the worker migration (don't preconfigure)

- Job idempotency keys and heartbeats (`packages/queue/envelope.ts` already
  provides the shape).
- Worker-side tenant establishment from `JobEnvelope` (§3.1 of `01.md`).
- SSE delivery of RunEvents replacing web polling.

Healthy staging smoke test: `/health/readiness` should be the one-line truth
that dependencies are reachable before any tenant traffic is pointed at the
box.
