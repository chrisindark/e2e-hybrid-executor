# e2e-hybrid-executor

A multi-tenant test execution platform: turn plain-English test intent into
structured, runnable steps (Playwright for UI, HTTP for API), recover from
selector drift with an LLM, and let a human promote the recovery back into an
immutable test version.

> **Status: mid-migration.** The repo is moving from a single NestJS process
> (v0 loop) toward the target topology: four deployables + Postgres/RLS +
> Redis/BullMQ. Tenancy via Postgres RLS is live; the queue and workers are not
> built yet — runs still execute on an in-process promise. See
> [ROADMAP.md](ROADMAP.md) and [docs/](docs/) for what works today.

## How it works

```
Intent ("log in and check the dashboard")
  → POST /v1/intent (LLM parses to a TestSpec v1)
  → Save test (v1/generation)         ── immutable TestVersion on save/promise
  → Run (POST /v1/execution/:testId/run → 202 { runId, status: 'QUEUED' })
  → Deterministic Playwright/HTTP steps + trace events
  → On drift: LLM recovery candidate, validated against a real post-condition
  → Human reviews the candidate (v1/promotion-candidates) and approves
  → Approval appends a new immutable TestVersion (never mutates steps in place)
```

## Repository layout

| Path                 | Contents                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/gateway-api`   | NestJS REST API: auth, tenants, CRUD, runs, trace, promotion, webhooks                              |
| `apps/web`           | Next.js 14 dashboard: intent, runs, trace, promotion review                                         |
| `services/`          | Target workers (`runner-e2e`, `runner-api`, `ai-service`, `scheduler`) — scaffolding, largely empty |
| `packages/contracts` | TestSpec v1 (zod), the seam between the AI and deterministic pipelines                              |
| `packages/db`        | Migrations + tenant context (`@repo/db`)                                                            |
| `packages/queue`     | Job envelope helpers (`@repo/queue`) — no real queue wired yet                                      |
| `packages/telemetry` | Request-scoped `RequestContext` (correlation id, tenant, actor)                                     |

## Quick start

Prerequisites: Node 20+, pnpm, Docker (for Postgres + Redis).

```bash
pnpm install
docker compose up -d                                          # Postgres 16, Redis 7
cp apps/gateway-api/.env.example apps/gateway-api/.env        # then set provider keys
cp apps/web/.env.example apps/web/.env.development
pnpm db:migrate                                               # schema (+ RLS policies)
./dev.sh                                                      # API :3001, web :3000
```

Playwright needs its browser once:

```bash
npx playwright install chromium --with-deps
```

Open http://localhost:3000. The web app mints a dev tenant JWT automatically
(see `NEXT_PUBLIC_TENANT_ID` — it must be a UUID, or RLS will reject every
request).

## Documentation

| File                                 | Purpose                                               |
| ------------------------------------ | ----------------------------------------------------- |
| [ARCHITECTURE.md](Architecture.md)   | Current architecture and target topology              |
| [ROADMAP.md](ROADMAP.md)             | Migration status and remaining work                   |
| [CONFIGURATION.md](CONFIGURATION.md) | Environment variables (two DB URLs, keys, CORS)       |
| [DEVELOPMENT.md](DEVELOPMENT.md)     | Workspace commands, hooks, migrations, code style     |
| [API_REFERENCE.md](API_REFERENCE.md) | HTTP endpoints under `/v1`                            |
| [SECURITY.md](SECURITY.md)           | RLS tenancy model, auth, secret handling              |
| [AGENTS.md](AGENTS.md)               | Working agreement for coding agents (read this first) |
| [docs/](docs/)                       | Topic guides + ADRs in `docs/adr/`                    |
| [examples/](examples/)               | Walkthrough examples                                  |
