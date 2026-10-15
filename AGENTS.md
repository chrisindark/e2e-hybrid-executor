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
- `packages/db/src/` also contains emitted build output (`data-source.js`,
  `.d.ts`, `.js.map`) sitting next to the `.ts` sources — edit the `.ts`, never
  the emitted files.
- The app is a single NestJS process on TypeORM/Postgres (`synchronize: false`,
  migrations in `packages/db`). There is still **no real queue**: runs execute on
  an unawaited in-process promise, so the process holds the work. The target is
  four deployables + Postgres/RLS + Redis/BullMQ. Do not "fix" toward the target
  unless the task says so; note it instead.
- `.env.example` still lists `DATABASE_PATH=database.sqlite` and a
  `database.sqlite` file lingers locally, but the active datasource is Postgres —
  don't trust that var.

## Documentation map — what to trust

| File                            | Status                                      | Use                                                                             |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| `Plans.md`                      | Target architecture for the migration       | Authority on the intended end state and why                                     |
| `01.md`                         | RFC/PRD: foundation, tenancy, TestSpec v1   | Authority on workspace layout, RLS, contracts                                   |
| `00-TECH-DEBT-AUDIT.md`         | **Completed** v0 defect list (AUDIT-01..07) | Historical record of the fixes; its fixed items are now invariants (see bottom) |
| `Architecture.md`               | Describes the **v0** loop                   | Background only; superseded by `Plans.md`                                       |
| `README.md`, `apps/*/README.md` | Partially stale                             | Verify paths/commands against the code before trusting                          |
| `Leadership_Document.md`        | Manager 90-day plan, not engineering spec   | Context only; do not treat as requirements                                      |

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
