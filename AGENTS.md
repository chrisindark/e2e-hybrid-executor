# AGENTS.md

Hybrid test execution platform: turns plain-English test intent into structured,
runnable steps (Playwright for UI, HTTP for API), recovers from selector drift
with an LLM, and lets a human promote the recovery back into the test definition.

## Read this first: the repo is mid-migration

The working tree on branch `staging` holds ~120 uncommitted changes. Treat
in-flight state as authoritative over committed state.

- `packages/` and `services/` are **untracked scaffolding** for the target
  architecture, and they are largely empty: `services/ai-service` and
  `services/scheduler` have no `src/` at all, and
  `services/runner-{e2e,api}/src/index.ts` plus `packages/queue/src/index.ts` are
  zero-byte files. Only `packages/contracts` (TestSpec zod schema),
  `packages/db/src/tenant-context.ts`, `packages/queue/src/envelope.ts`, and
  `packages/telemetry/src/request-context.ts` hold real code. Don't assume a
  package listed in a plan document exists or works.
- The app is a single NestJS process on TypeORM/Postgres (`synchronize: false`,
  migrations in `packages/db`). There is still **no real queue**: runs execute on
  an unawaited in-process promise, so the process holds the work. The target is
  four deployables + Postgres/RLS + Redis/BullMQ. Do not "fix" toward the target
  unless the task says so; note it instead.
- Postgres is the only real datasource; a `database.sqlite` file may still linger
  locally but nothing reads it (the stray `DATABASE_PATH` var is gone from
  `.env.example`). There are **two** DB URLs: `DATABASE_URL` is the owning role
  used for migrations/DDL, and `DATABASE_APP_URL` is `app_runtime` — a
  non-superuser LOGIN that runtime traffic uses so RLS is enforced at all. Prefer
  the admin URL for `psql`, the app URL when you need to see what RLS does.
- Tenant isolation is **live**. Migrations
  `1792066610064-tenant-isolation-rls` (tables, policies, `current_tenant_id()`)
  and `1792069042212-tenant-roles-and-defaults` (roles, plus a
  `current_tenant_id()` default on every `tenantId`) are both applied. The
  request-scoped wiring lives in `apps/gateway-api/src/database/` —
  `tenant-scope.interceptor.ts`, `tenant-repository.ts`, `tenant-context.ts`,
  `tenant-transaction.service.ts`. See `01.md` §2.2/§3.1.

## Documentation map — what to trust

| File                            | Status                                    | Use                                                                          |
| ------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `Plans.md`                      | Target architecture for the migration     | Authority on the intended end state and why                                  |
| `01.md`                         | Phase-0 RLS + topology gaps               | §2.2/§3 is written against the applied state; §1.1 and `TEST-SPEC-01` remain |
| `Architecture.md`               | Describes the **v0** loop                 | Background only; superseded by `Plans.md`                                    |
| `README.md`, `apps/*/README.md` | Partially stale                           | Verify paths/commands against the code before trusting                       |
| `Leadership_Document.md`        | Manager 90-day plan, not engineering spec | Context only; do not treat as requirements                                   |

## Layout

```
apps/gateway-api/   NestJS modular monolith: auth, tenants, CRUD, runs, webhooks
apps/web/           Next.js 14 dashboard: intent, runs, trace, promotion review
services/           runner-e2e (Playwright), runner-api (HTTP), ai-service, scheduler
packages/           contracts, db, queue, telemetry, types (step-engine/ui-kit planned)
```

Inside `apps/gateway-api/src`: `apps/mainApp/modules/<feature>` per feature
(`intent`, `execution`, `agentic-execution`, `trace-event`, `promotion-candidate`,
`e2e-tests`, `test-store`, `test-run`, `run`, `auth`, `health`), with shared code
in `common/`, `guards/`, `config/`, `database/`, `shared/`.

## Architecture boundaries (non-negotiable)

1. Runners and `ai-service` never import each other; they exchange data only
   through `packages/contracts`.
2. Workers never serve HTTP traffic — jobs in via Redis, events out via Redis Streams.
3. Only `apps/gateway-api` and `packages/db` run DDL migrations.

## Commands

Workspace uses **pnpm** (see the `devEngines.packageManager` pin) with Turborepo.
Do not introduce npm/yarn lockfiles or commands.

```bash
pnpm install                    # repo root
./dev.sh                        # api + web together
pnpm run build                  # turbo run build
pnpm run lint                   # turbo run lint
pnpm run dev:api                # = apps/gateway-api start:dev (port 8000)
pnpm run dev:web                # = apps/web dev (port 3000)
```

Per-app (`apps/gateway-api`): `pnpm run check` = format:check + lint + build +
test. `test:e2e` uses `test/jest-e2e.json`. Migrations go through `packages/db`
(`db:generate`, `db:migrate`, `db:rollback`, `db:show`).

Git hooks live in `apps/gateway-api/.husky`: pre-commit runs `lint-staged`,
pre-push runs `pnpm run check`. Expect both on commit/push.

## Conventions

- TypeScript strict everywhere. `packages/*` use `tsconfig.base.json`
  (`module: NodeNext`); `apps/gateway-api` overrides to `commonjs` with decorators.
- Workspace imports use `@repo/*` (`@repo/types`, `@repo/telemetry`, ...).
- Prettier is enforced (`prettier/prettier` and `format:check`); imports and
  exports are auto-sorted by `simple-import-sort`. Run `lint:fix` rather than
  hand-ordering imports.
- NestJS style: one module directory per feature with `.module.ts`,
  `.controller.ts`, `.service.ts`, plus `dto/`.
- Commits follow `type: description` (`feat:`, `fix:`).
- Never commit secrets or `.env*` (only `.env.example` is tracked). Rotate any key
  that has already appeared in a local file.

## Ignore when exploring

`node_modules/`, `dist/`, `.next/`, `.turbo/`, `coverage/`, `*.tsbuildinfo`,
`pnpm-lock.yaml`, `apps/gateway-api/.pnpm-store/`, `docs/.gitkeep`,
`apps/gateway-api/database.sqlite`, `*.log`.

Prefer `git ls-files` mental model over `find` — build artifacts and DB files show
up otherwise.

## Invariants from the completed audit (AUDIT-01..07) — do not undo

All seven are fixed. They encode subtle decisions that look like complexity to
"simplify" away, so preserve them:

- Assertions resolve text from `expectedOutcome ?? value`, never a bare `value`.
- Recovery is two-stage: candidate presence **and** a real
  `toContainText`/visibility post-condition, reporting
  `RECOVERY_VALIDATION_FAILED`. Presence alone is a silent pass.
- Promotion appends a new immutable `TestVersion`; it never mutates `test_steps`.
  Runs pin a version.
- The DOM snapshot queries interactive primitives and filters to visible,
  in-viewport nodes before capping. Don't revert to `[id], [class]`.
- Run start returns `202 { runId, status: 'QUEUED' }` immediately; don't await the
  browser run in the request.
- `JwtAuthGuard` is global via `APP_GUARD`; opt out with `@Public()`, never by
  removing the guard.
- `synchronize` stays `false`; schema changes go through migrations.

## Tenancy invariants (RLS) — do not undo

Multi-tenancy is enforced by Postgres RLS, not by application `WHERE` clauses. It
works only if these hold:

- `tenantId` columns are `@Column({ type: 'uuid', insert: false, update: false })`.
  The app never writes the tenant; the DB fills it from
  `DEFAULT current_tenant_id()`. Making it insertable re-opens request-payload
  tenant spoofing.
- Isolated repositories come from `TenantRepositoriesModule` (a `@Global()`
  module that wraps each `@InjectRepository` provider with the ALS-bound
  manager). Don't reintroduce `TypeOrmModule.forFeature` in a feature module —
  it hands back the root manager and silently drops tenancy.
- `TenantScopeInterceptor` is the only thing that sets `app.tenant_id` for a
  request. It uses a session-scoped `set_config('app.tenant_id', …, false)` on a
  dedicated `QueryRunner`, cleared before release — not `SET LOCAL`, because the
  queued run is fire-and-forget and outlives the request. `runWithTenant` gives
  that run its own scoped connection.
- The GUC name itself is exported as `TENANT_SETTING` from `@repo/db` and imported
  by the gateway's `TenantTransactionService`. Don't re-type `'app.tenant_id'` in a
  new client — a mismatch silently disables the policies rather than failing.
  Migrations keep the literal on purpose; an applied migration is a historical
  record and must not track a source constant.
- Runtime must connect as a non-superuser. `FORCE ROW LEVEL SECURITY` still does
  **not** apply to a superuser, so connecting as `orchestrator` makes every policy
  a no-op. `PostgresService` warns at boot if the runtime connection is a
  superuser.
- `tenantId` columns are populated by the DB default, so any code that inserts
  must be inside a tenant scope. An insert with no tenant set fails closed
  (SQLSTATE 42501, or a NOT NULL violation).
