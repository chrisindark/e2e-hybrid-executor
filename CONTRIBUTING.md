# CONTRIBUTING

Thanks for helping build `e2e-hybrid-executor`. The repo is mid-migration, so
read [AGENTS.md](AGENTS.md) first — it lists what is scaffolding, what is
authoritative, and which invariants must not be "simplified".

## Ground rules

1. **pnpm only.** Never introduce npm/yarn lockfiles or commands.
2. **Migrations over `synchronize`.** Schema changes go through `packages/db`
   (`pnpm db:generate` → review → `pnpm db:migrate`). `synchronize` stays
   `false`.
3. **Architecture boundaries.** Domain code (`src/modules/**`) never imports
   the HTTP layer (`src/apps/mainApp/**`). Runners/AI never import each other;
   the seam is `packages/contracts`.
4. **Tenancy invariants.** No insertable `tenantId`, no `TypeOrmModule.forFeature`
   in feature modules, no second `app.tenant_id` literal. See
   [docs/tenant-isolation.md](docs/tenant-isolation.md).
5. **Don't undo audit fixes/protected invariants** — assertion resolution,
   two-stage recovery, immutable versions, DOM snapshot query, `202` run
   start, global guard, `synchronize: false` (listed in [AGENTS.md](AGENTS.md)).

## Workflow

```bash
# always run from a current `staging`
pnpm install
docker compose up -d
pnpm db:migrate
pnpm run lint && pnpm run build
```

Hooks run automatically: pre-commit `lint-staged`, pre-push
`pnpm run check` (in `apps/gateway-api/.husky`).

## Conventions

- TypeScript strict everywhere; `@repo/*` for workspace imports.
- Prettier + `simple-import-sort` — use `lint:fix`,
  don't hand-order imports.
- Commits: `type: description` (`feat:`, `fix:`, `chore:`, `refactor:`).
- Tests: new behavior in domain services gets unit tests (jest unit config);
  regression tests accompany every bug fix. Prefer `describe`/`it` aligned with
  the existing `__tests__` folders.

## Pull requests

- One concern per PR; keep migration PRs separate from behavior PRs.
- Include: what changed, what invariant(s) it touches, how it was tested
  (`pnpm run check` output, seed of the failing test).
- If you changed entities: regenerate migrations, never hand-edit DB state.
- If you touched tenancy or the run lifecycle: update the relevant doc
  ([docs/tenant-isolation.md](docs/tenant-isolation.md),
  [docs/run-lifecycle.md](docs/run-lifecycle.md)) and
  [CHANGELOG.md](CHANGELOG.md) under **Unreleased**.

## The mid-migration deal

Empty `services/` directories and zero-byte entrypoints are plan scaffolding.
Filling them in is roadmap work ([ROADMAP.md](ROADMAP.md)), not drive-by
cleanup. If your task hits the in-process run promise or the missing queue,
note it in the PR — don't silently "fix" toward the target topology.
