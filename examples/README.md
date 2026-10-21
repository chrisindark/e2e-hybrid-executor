# Examples

Runnable walkthroughs of the hybrid execution loop. These examples mirror the
_v0 demo flow_ exactly as it runs today (single-process gateway, web polls,
no queue) so they keep working until the worker migration changes the run
lifecycle — at which point each example will note the new trigger/consume
pairs.

| File                                              | What it demonstrates                                                                                                                       | Transport   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `01-first-http-suite.md` _(planned)_              | Authoring an `api.request`-only TestSpec v1 by hand, validating it against `packages/contracts`, and running it — no browser, no LLM       | HTTP        |
| `02-intent-to-structured-ui-test.md` _(planned)_  | `POST /v1/intent` with plain-English intent → generated `ui.*` steps → save via `/v1/generation`                                           | HTTP + web  |
| `03-force-drift-and-recover.md` _(planned)_       | Running a saved test with a forced UI drift, watching deterministic + agentic trace events, and reviewing the validated recovery candidate | web         |
| `04-promote-recovery.md` _(planned)_              | `POST /v1/promotion-candidates/:id/decide` approve → new immutable `TestVersion`; subsequent runs pin the new version                      | HTTP        |
| `05-tenant-isolation-from-scratch.md` _(planned)_ | Mint two tenant tokens, seed rows, and observe cross-tenant emptiness under RLS                                                            | HTTP + psql |

## Until the example files land

The [README "Demo flow"](../README.md#how-it-works) plus
[docs/getting-started.md](../docs/getting-started.md) cover the same ground in
narrative form:

1. Open the dashboard, enter an intent + target URL, generate and save the
   structured test.
2. Review saved steps; optionally pick a step for forced UI drift.
3. Run it and inspect deterministic and agentic trace events.
4. Review the promotion candidate; approving appends a new test
   version used by future runs.

Conventions for new examples: start from a clean tenant, include the exact
`curl` or UI click path, state which env vars matter (`JWT_SECRET`,
`NEXT_PUBLIC_TENANT_ID`), and capture expected HTTP status codes (the run
start is `202 { runId, status: 'QUEUED' }` — do not document a synchronous
result).
