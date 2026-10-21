# Testing

What test surface exists, and how to run it. The repo is mid-migration, so
some areas (workers) have no tests yet because there is no code.

## Gateway (`apps/gateway-api`)

| Command                                   | What it does                                                |
| ----------------------------------------- | ----------------------------------------------------------- |
| `pnpm run test:unit`                      | unit tests via `jest.unit.config.ts`                        |
| `pnpm run test:watch` / `test:unit:watch` | watch mode                                                  |
| `pnpm run test:cov`                       | full unit coverage (clean `coverage/`, no cache)            |
| `pnpm run test:e2e`                       | `test/jest-e2e.json` — full-app tests (boots the Nest app)  |
| `pnpm run test:debug`                     | `--detectOpenHandles --verbose --forceExit` for leak hunts  |
| `pnpm run check`                          | format:check + lint + build + all tests (the pre-push gate) |

Unit tests live next to code in `__tests__/` directories
(controllers/entities/guards all have them). E2E tests require Postgres (and
the migrations applied) — they exercise the real RLS behavior, which unit
tests with mocked repositories cannot.

## What the test suite must keep preserving

These are the tests behind the audit invariants in [../AGENTS.md](../AGENTS.md):

- **Assertions** resolve `expectedOutcome ?? value` (never bare `value`).
- **Recovery** requires the two-stage gate (candidate presence **and** a real
  `toContainText`/visibility post-condition); presence-only proposals must
  yield `RECOVERY_VALIDATION_FAILED`.
- **Promotion** appends an immutable `TestVersion`; runs pin a version.
- Run start returns `202 { runId, status: 'QUEUED' }` immediately.
- `JwtAuthGuard` is global; `@Public()` is the only opt-out.
- Tenant isolation: `TEST-RLS-01`/`TEST-RLS-02` cover RLS behavior from the
  runtime role (`app_runtime`), including insert-fail-closed outside tenant
  scope.

## Known gaps

- `TEST-ALS-01` (ALS propagation end-to-end) and `TEST-SPEC-01` (TestSpec
  contract round-trip in `packages/contracts`) are **remaining scope** in
  `01.md` §3.2 — flagged in [../ROADMAP.md](../ROADMAP.md).
- The Playwright-driven E2E suite for runner flows will belong to
  `services/runner-e2e` and does not exist yet.
- No browser-level "does the dashboard render" e2e for the web app; leave one
  only if it doesn't depend on the in-flight UI state.

## Testing with tests off-line

`packages/contracts` tests (the planned `TEST-SPEC-01`) need no Postgres and
no LLM: schema round-trips are the cheapest guard for the seam. Do not let a
TestSpec v1 change land without covering every step payload it accepts.
