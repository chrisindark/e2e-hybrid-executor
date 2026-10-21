# ROADMAP

Status as of October 2026. The authority on the intended end state is
[Plans.md](Plans.md); the phase-0 gap list is `01.md` (§0, §1.1, §3.1, §3.2).
This file tracks what is **done**, **in flight**, and **not started**.

## Phase 0 — architecture foundation

| Item                                                                                   | Status                            |
| -------------------------------------------------------------------------------------- | --------------------------------- |
| pnpm + Turborepo monorepo (`pnpm-workspace.yaml`, `turbo.json`)                        | ✅ done                           |
| `RequestContext` ALS (`@repo/telemetry`) + correlation-id middleware                   | ✅ done                           |
| `TenantContext`/`TenantDatabaseClient` (`withTenant`, `withSystemAdmin`) in `@repo/db` | ✅ done                           |
| `JobEnvelope` / `wrapJob` in `packages/queue`                                          | ✅ done (helpers only — no queue) |
| TestSpec v1 zod contract in `packages/contracts`                                       | ✅ done                           |
| JWT auth foundation, global `JwtAuthGuard` + `@Public()`                               | ✅ done                           |
| Postgres RLS applied **and enforced** (`tenant-isolation-rls` migration)               | ✅ done                           |
| Tenant roles + `current_tenant_id()` defaults (`tenant-roles-and-defaults`)            | ✅ done                           |
| Per-request tenant connection, `TenantRepositoriesModule`, `TenantScopeInterceptor`    | ✅ done                           |
| Domain/transport split inside `apps/gateway-api` (eslint-enforced)                     | ✅ done                           |
| Global exception filters + unit test scaffolding                                       | ✅ done                           |
| `TEST-RLS-01`, `TEST-RLS-02` verified                                                  | ✅ done                           |
| `TEST-ALS-01` (ALS propagation test)                                                   | ⏳ remaining                      |
| `TEST-SPEC-01` (contract round-trip test)                                              | ⏳ remaining                      |

## Phase 1 — queue + workers (not started)

Directories exist as scaffolding; `services/ai-service` and `services/scheduler`
have no `src/`, and `runner-{e2e,api}/src/index.ts` plus
`packages/queue/src/index.ts` are zero-byte. Don't assume a package listed in a
plan document exists or works.

- [ ] Replace the unawaited in-process run promise with Redis/BullMQ
      (`runs.e2e`, `runs.api`, `ai.authoring` queues) using `@repo/queue`.
- [ ] Worker-side tenant scope: each job must establish `app.tenant_id`
      itself (`runWithTenant` + `JobEnvelope`); the gateway does this today,
      workers don't exist yet.
- [ ] `services/runner-e2e` — Playwright worker; `NoopRecovery` stub first so
      the deterministic pipeline needs no LLM.
- [ ] `services/runner-api` — HTTP-only worker (no browser).
- [ ] `packages/step-engine` — action registry (`ui.*`, `api.*`) shared by both
      runners. Absent today.
- [ ] Run events out via Redis Streams; gateway SSE replaces web polling.
- [ ] `services/ai-service` — recovery behind the `RecoveryPort` contract,
      with a `FakeRunner` for testing without a browser/queue.

## Phase 2 — platform track

- [ ] Queue fairness: shard queues by plan tier; Redis token bucket per tenant
      for max concurrent runs; re-delay over-cap jobs instead of blocking.
- [ ] Gateway rate limits/quotas (runs/min, parallel browsers, LLM tokens).
- [ ] Per-tenant API keys for CI; per-tenant encrypted secrets injected into
      runs as `{{secret.X}}`, never stored in the spec.
- [ ] Artifact storage: S3 or MinIO (`docker-compose.yml` covers Postgres +
      Redis, not artifacts). Screenshots/trace bundles have nowhere to go.
- [ ] OpenTelemetry tracing; extend logging with `tenantId`.
- [ ] Evaluate Temporal only if approval waits / long-lived suites demand it;
      BullMQ is enough for v1.

## Do not "fix" toward the target

The in-process promise run, the single-process topology, and the empty
services are mid-migration state, not defects to clean up opportunistically.
If a task touches them, note it; change them only when the task says so.
See [AGENTS.md](AGENTS.md) for the in-flight-state caveats.

## Audit fixes — protected invariants

AUDIT-01..07 are fixed and must not regress: assertion text resolution
(`expectedOutcome ?? value`), two-stage recovery validation,
immutable-version promotion, DOM-snapshot interactive-primitive query, `202`
run start, global `JwtAuthGuard` with `@Public()`, and `synchronize: false`.
Details in [AGENTS.md](AGENTS.md).
