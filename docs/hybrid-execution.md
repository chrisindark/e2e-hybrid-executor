# Hybrid execution

One test, two transport modes: deterministic browser steps (Playwright) and
deterministic HTTP steps (`api.request`), mixed freely in a single
[TestSpec](concepts.md#testspec). Related: [run-lifecycle.md](run-lifecycle.md),
[trace-events.md](trace-events.md).

## Why hybrid

- HTTP-only checks are cheap, fast, and stable — a health/status/JSON
  assertion doesn't need Chromium.
- Visual/behavioral checks (clicks, navigation, visibility) genuinely need the
  browser.
- A recovery failure isolates naturally: a drifted locator farms out to the
  AI recovery path without touching the API steps in the same run.

## Step types (TestSpec v1 contract)

Defined in `packages/contracts/src/spec/test-spec.ts`:

| Type               | Payload highlights                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ui.goto`          | `url`, `timeoutMs` (default 30_000)                                                                                                 |
| `ui.click`         | `locator` (primary + ranked alternates + semantic `intent`), `clickCount`, `timeoutMs`                                              |
| `ui.fill`          | `locator`, `value`, `masked` (for sensitive values), `timeoutMs`                                                                    |
| `ui.assertText`    | `locator`, `expectedText`, `operator` (`equals`/`contains`/`matches_regex`), `timeoutMs`                                            |
| `ui.assertVisible` | `locator`, `timeoutMs`                                                                                                              |
| `api.request`      | `method`, `url`, `headers`, `body`, `extract` (variable rules), `assertions` (path/operator/expected), `timeoutMs` (default 10_000) |

`assertions` operators: `equals`, `not_equals`, `contains`, `greater_than`,
`less_than`, `schema_valid`. `extract` rules use `jsonPath` with an optional
`fallback` and deposit into named run variables usable by later steps.

> **Contract vs runtime (today).** The gateway doesn't import
> `@repo/contracts` yet. What actually executes is the legacy `TestStep`
> (`TestAction`: `goto`/`click`/`fill`/`assertText`/`assertVisible`) with a
> single CSS `selector` — so `api.request`, `alternates`, `intent`, and
> `envVariables` are contract-only until A0 / the step-engine work lands
> ([../ROADMAP.md](../ROADMAP.md)).

**Runtime `assertText` semantics:** the legacy executor reads its literal text
from `expectedOutcome` (falling back to `value` only when `expectedOutcome` is
nullish) and matches it with Playwright `hasText`. Authoring output must
therefore put the exact element text — `Swag Labs`, not "the text is
visible" — in `expectedOutcome`; the intent prompt enforces this.

## How a mixed spec executes

Target behavior (per the contract); today only the UI half runs, in-process:

1. The runner executes steps in order; UI steps go through Playwright, API
   steps through a plain HTTP client. Both emit trace events.
2. Assertions in both families resolve their expected value from
   `expectedOutcome ?? value` (never a bare `value`).
3. Variables extracted from API responses are available to subsequent steps
   (auth tokens, ids) — the typical hybrid pattern is
   `api.request (login)` → `ui.goto` with a captured session.

## The extension surface

New step types mean extending the discriminated union in
`packages/contracts` first — the contract is the seam; runners (when built)
are consumers only. `packages/step-engine` (an action registry shared by both
runners) is the planned home for the `ui.*`/`api.*` registries; it doesn't
exist yet, so today the registry implicitly lives in the deterministic
executors (Playwright/Playwright-like).

## UI step defaults worth knowing

- `timeoutMs` defaults to 5000 for action/assert steps, 30000 for `goto`.
- Locators carry ranked `alternates` with a `confidence` (0..1, default 1.0).
  Drift recovery proposes a new alternates entry rather than silently
  reordering them — see [selector-drift-recovery.md](selector-drift-recovery.md).

## What this doc does _not_ cover

- Workers consuming hybrid jobs (`runner-e2e`, `runner-api`) — not built;
  see the mid-migration state in [../ROADMAP.md](../ROADMAP.md).
- Variable injection of per-tenant secrets (`{{secret.X}}`) — planned.
