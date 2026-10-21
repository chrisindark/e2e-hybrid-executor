# DEVELOPMENT

Workspace notes and everyday commands. For architecture see
[ARCHITECTURE.md](Architecture.md); for env vars see [CONFIGURATION.md](CONFIGURATION.md).

The repo is **mid-migration** (~120 uncommitted changes on `staging` were part
of the recent work). Treat in-flight state as authoritative over committed
state, and see [AGENTS.md](AGENTS.md) before large changes.

## Prerequisites

- Node 20+
- pnpm (pinned via `devEngines.packageManager`; do not introduce npm/yarn
  lockfiles or commands)
- Docker for Postgres 16 + Redis 7

## Setup

```bash
pnpm install
docker compose up -d          # Postgres :5432, Redis :6379
cp apps/gateway-api/.env.example apps/gateway-api/.env
cp apps/web/.env.example apps/web/.env.development
pnpm db:migrate               # from repo root (wraps @repo/db)
npx playwright install chromium --with-deps
```

## Run

```bash
./dev.sh                      # api + web together, Ctrl-C stops both
pnpm run dev:api              # gateway-api on :3001 (nest start --watch)
pnpm run dev:web              # web on :3000 (next dev)
```

Health: `GET /health/liveness`, `GET /health/readiness` (version-neutral,
public).

## Migrations

Schema changes never use `synchronize` (it stays `false`). Only
`apps/gateway-api` and `packages/db` run DDL.

```bash
pnpm db:generate   # generate a migration from entity diffs
pnpm db:migrate    # apply (runs as the DATABASE_URL owning role)
pnpm db:show       # list applied/pending
pnpm db:rollback   # roll back the last migration
```

Applied migrations are historical records — they must not track source
constants (the `app.tenant_id` GUC is a literal in migrations on purpose;
source keeps the exported `TENANT_SETTING` from `@repo/db`).

## Quality gates

Root:

```bash
pnpm run build     # turbo run build
pnpm run lint      # turbo run lint
```

Per app (`apps/gateway-api`): `pnpm run check` =
`format:check + lint + build + test`. Use `lint:fix` rather than hand-ordering
imports — `simple-import-sort`, prettier and `unused-imports` rules are all
auto-fixing. E2E tests: `pnpm run test:e2e` (`test/jest-e2e.json`).

## Git hooks

Hooks live in `apps/gateway-api/.husky`:

- **pre-commit** → `lint-staged` (prettier + eslint --fix on staged TS/MD/JSON)
- **pre-push** → `pnpm run check`

Husky installs via the `prepare` script in `apps/gateway-api/package.json`,
so they come back after every `pnpm install`.

## Code style

- TypeScript strict everywhere. `packages/*` use `tsconfig.base.json`
  (`module: NodeNext`); `apps/gateway-api` overrides to `commonjs` for
  decorators.
- Workspace imports use `@repo/*`.
- NestJS style: one module directory per feature (`*.module.ts`,
  `*.controller.ts`, `*.service.ts`, `dto/`) — **but** inside gateway-api the
  domain lives in `src/modules/<feature>` without controllers/DTOs; HTTP wiring
  is in `src/apps/mainApp`. New domain code follows the domain-module split.
- Boundary rule: `src/modules/**` must never import `src/apps/mainApp/**`
  (controllers/DTOs). Enforced by `no-restricted-imports` in
  `apps/gateway-api/eslint.config.mjs`.
- Commits: `type: description` (`feat:`, `fix:`, `chore:`, `refactor:`).

## Local data notes

- Postgres is the only real datasource. A `database.sqlite` may linger in
  `apps/gateway-api/`; nothing reads it, and `DATABASE_PATH` is gone from
  `.env.example`.
- `psql` admin/inspection goes through `DATABASE_URL` (owner role). Use the
  app URL only when you want to observe RLS behavior.
- `docs/.gitkeep`, `*.tsbuildinfo`, `dist/`, `coverage/`, turbo caches are
  ignore-listed noise.
