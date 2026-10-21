# Architecture

Canonical architecture doc for `e2e-hybrid-executor`. The repo is
**mid-migration**: the current state (single NestJS process) and the target
state (four deployables) both appear below; [Plans.md](Plans.md) is the authority
on the intended end state and [ROADMAP.md](ROADMAP.md) tracks the gap.

The old version of this file described only the v0 loop; it was rewritten when
tenancy went live. v0 history lives in git.

## Current topology (what runs today)

```
Next.js :3000  ──REST poll──▶  NestJS gateway-api :3001
                                 │  one process, modular monolith
                                 │  TypeORM + Postgres (RLS-enforced tenancy)
                                 └─ runs execute on an unawaited in-process promise
                                    (no queue; the process holds the work)
```

- **`apps/gateway-api`** — NestJS 11, URI-versioned REST under `/v1`. Auth is a
  global `JwtAuthGuard` (opt out with `@Public()`). DDL migrations run from
  `packages/db`; runtime connects to Postgres as a **non-superuser** so RLS is
  enforced.
- **`apps/web`** — Next.js 14 dashboard: intent capture, saved tests, run
  console with trace events, promotion review. Polls REST; there is no SSE.
- **Postgres 16** is the only real datastore (a stray `database.sqlite` may
  linger locally; nothing reads it). **Redis 7** is reachable via
  `docker-compose.yml` but no queue is wired to it yet.
- **`services/`** is untracked scaffolding for the target workers
  (`runner-e2e`, `runner-api`, `ai-service`, `scheduler`) and is largely empty.
  `packages/contracts`, `@repo/db`, `@repo/queue` (envelope), and
  `@repo/telemetry` hold real code.

## Domain layout inside `apps/gateway-api`

```
src/
  apps/mainApp/          HTTP transport: main-app.module.ts, controllers/, dto/
  modules/<feature>/     Transport-agnostic domain logic (services + modules,
                         NO controllers, NO HTTP DTOs) for intent, execution,
                         agentic-execution, trace-event, promotion-candidate,
                         e2e-tests, test-store, test-run, run, auth, health
  guards/ common/ config/ database/ shared/   cross-cutting pieces
```

- The dependency direction is **HTTP → domain only**: `src/modules/**` must not
  import `apps/mainApp/**` (its controllers or DTOs); request shapes cross the
  seam as transport-agnostic input types. Enforced by a `no-restricted-imports`
  rule in `apps/gateway-api/eslint.config.mjs`.
- Request-scoped context (`RequestContext`: correlationId, tenantId, actorId) is
  owned by `@repo/telemetry`; there is no gateway-local AsyncLocalStorage.
- Entities live in `src/shared/`: `tenant`, `test-definition`, `test-step`,
  `test-version`, `run`, `test-step-attempt`, `trace-event`,
  `promotion-candidate` — every business table carries `tenantId`.

## Tenancy: Postgres RLS, not app-level WHERE clauses

Multi-tenancy is enforced by the database engine:

- Migrations `1792066610064-tenant-isolation-rls` (tables, policies,
  `current_tenant_id()`) and `1792069042212-tenant-roles-and-defaults` (roles,
  `current_tenant_id()` default on every `tenantId`) are applied.
- `TenantScopeInterceptor` is the **only** writer of the RLSS GUC
  `app.tenant_id`: a session-scoped `set_config(..., false)` on a dedicated
  `QueryRunner`, cleared before release (not `SET LOCAL`, because the queued run
  is fire-and-forget and outlives the request). `runWithTenant` gives that run
  its own scoped connection.
- `tenantId` columns are `uuid` with `insert: false, update: false` — the app
  never writes the tenant; the DB default fills it. Inserting outside tenant
  scope fails closed (SQLSTATE 42501).
- Isolated repositories come from `TenantRepositoriesModule` (a global module
  wrapping each `@InjectRepository` with the ALS-bound manager). Feature
  modules must not use `TypeOrmModule.forFeature` directly.
- Two connection strings: `DATABASE_URL` is the owning role used for
  migrations/DDL, `DATABASE_APP_URL` is `app_runtime`, a non-superuser LOGIN
  runtime traffic uses so RLS actually applies. Runtime must never be a
  superuser (`FORCE ROW LEVEL SECURITY` does not apply to superusers);
  `PostgresService` warns at boot if it is.

Details and invariants: [docs/tenant-isolation.md](docs/tenant-isolation.md),
[SECURITY.md](SECURITY.md).

## The pipeline seam

The AI pipeline and the deterministic pipeline share **contracts and nothing
else** (from [Plans.md](Plans.md)):

| Contract           | Owner                | Direction                                                       |
| ------------------ | -------------------- | --------------------------------------------------------------- |
| TestSpec v1 (zod)  | `packages/contracts` | AI pipeline produces; deterministic pipeline consumes           |
| RunJob / RunEvent  | `packages/contracts` | Deterministic pipeline produces; UI/AI consume                  |
| RecoveryPort       | `packages/contracts` | Runner calls; AI service implements                             |
| PromotionCandidate | `packages/contracts` | AI pipeline produces; human approval creates a new test version |

TestSpec v1 step types today: `ui.goto`, `ui.click`, `ui.fill`,
`ui.assertText`, `ui.assertVisible`, `api.request` (with `extract` variable
rules and `assertions`). Locators carry a primary + ranked alternates +
semantic `intent` — that intent is what the recovery LLM reasons about.

## The v0 → v1 test lifecycle

1. `POST /v1/intent` — LLM (Groq for parsing, Gemini for agentic recovery)
   converts plain-English intent + target URL into a structured spec.
2. `v1/generation` CRUD — saved tests. Versioning appends an immutable
   `TestVersion`; runs pin a version. Promotion never mutates `test_steps`.
3. `POST /v1/execution/:testId/run` returns `202 { runId, status: 'QUEUED' }`
   immediately; the browser run is never awaited in the request.
4. Steps execute (Playwright deterministically first; `api.request` over HTTP)
   and emit `trace-event` rows. Assertions resolve text from
   `expectedOutcome ?? value`, never a bare `value`.
5. On selector drift with recovery enabled: a candidate is proposed only if it
   passes **two** stages — presence **and** a real `toContainText`/visibility
   post-condition; failures report `RECOVERY_VALIDATION_FAILED` (presence alone
   is a silent pass).
6. The DOM snapshot for recovery queries interactive primitives and filters to
   visible, in-viewport nodes before capping.
7. `POST /v1/promotion-candidates/:promotionId/decide` — approving appends a
   new immutable `TestVersion`; rejecting just closes the candidate.

## Target topology (Planned, do not "fix" toward it casually)

```
UI / CI / schedule ─▶ gateway-api ──202 + runId──▶ Postgres (runs, outbox)
                        │ enqueue (BullMQ via Redis)
                        ▼
        runs.e2e | runs.api | ai.authoring
        ├── runner-e2e (Playwright worker)      ├── runner-api (HTTP-only worker)
        ├── ai-service (authoring, recovery, evals)  └─ scheduler (cron, fan-out)
        └── RunEvents ─▶ Redis Streams ─▶ gateway SSE ─▶ UI
        Artifacts ─▶ S3/MinIO; tracing via OpenTelemetry
```

Boundary rules (non-negotiable once built):

1. Runners and `ai-service` never import each other; they exchange data only
   through `packages/contracts`.
2. Workers never serve HTTP traffic — jobs in via Redis, events out via Redis
   Streams.
3. Only `apps/gateway-api` and `packages/db` run DDL migrations.
4. HTTP → domain only (see above); today's `eslint` rule is the seed of this.

Until those workers exist, **there is no real queue**: runs execute on an
unawaited in-process promise and the process holds the work. That is a known
gap, not a bug — see `01.md` (worker-side tenancy, missing workspace members)
and [ROADMAP.md](ROADMAP.md).
