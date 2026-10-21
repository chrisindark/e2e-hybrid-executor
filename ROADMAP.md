# ROADMAP

This file tracks **status and delivery order**. [Plans.md](Plans.md) remains the
authority on the intended end state and why; `01.md` holds the phase-0 gap
detail. Milestones are workstream labels (`A…` deterministic, `B…` AI); the
five phases are the order in which work is delivered across three parallel
tracks.

Status as of October 2026.

**Legend:** ✅ done · 🟡 partial / in progress · ⬜ not started

## Where we are now

- **Tenancy + contracts + auth core are live**: Postgres RLS enforced under a
  non-superuser runtime role, TestSpec v1 in `packages/contracts` (contract
  only — not yet imported by the gateway), global JWT
  guard, domain/transport seam lint-enforced.
- **The next step is Phase 1** — the queue and workers. Everything downstream
  (reliability, scale, async authoring) waits on it, and today runs execute on
  an unawaited in-process promise that the gateway process holds.
- **Hybrid/recovery work is "pre-paid"**: v0 already built two-stage recovery
  verification, snapshot pruning, and immutable-version promotion — Phase 3
  scope that exists ahead of schedule. It still has to be re-homed behind
  `RecoveryPort` and the worker seam; it is not wasted, and it is not done.
- Phase 0's cross-track definition in Plans also includes `LlmPort` (B0) and
  `packages/ui-kit`; those two are **not** built, so they stay open below.

## Build order at a glance

| Phase               | Deterministic track                                                     | AI track                             | UI / Platform track                       | Status                                           |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------- | ------------------------------------------------ |
| **0 — Foundation**  | contracts, TestSpec v1, Postgres schema + RLS                           | `LlmPort`                            | pnpm/Turbo, ui-kit, auth + tenant context | 🟡 core done; `LlmPort` + ui-kit open            |
| **1 — Async core**  | gateway trigger → queue → `runner-e2e`; run state machine; events + SSE | spec validator + fake runner         | test list, run console                    | 🟡 next; trigger contract (`202`) only           |
| **2 — Reliability** | retries, heartbeats, idempotent events, artifacts, `runner-api`         | authoring (intent → spec)            | builder with schema-driven forms          | ⬜                                               |
| **3 — Hybrid**      | locator ladder + `RecoveryPort` wiring                                  | recovery with verification + caching | promotion inbox                           | 🟡 verification + inbox already exist in-process |
| **4 — Scale**       | fairness, quotas, autoscaling, webhooks, CI checks                      | evals, agentic-primary + compiler    | recorder, importers, schedules            | ⬜                                               |

## Pipeline A — deterministic milestones

| Milestone                 | Scope                                                                                                                                                                                                                                                  | Status | Where it stands                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A0 — Spec & contracts** | TestSpec v1 contract **and** a runtime that consumes it (locators with `alternates` + `intent`, `api.request`); `{{var}}` chaining; data-driven tables; immutable version snapshots, runs pin a `version_id`                                           | 🟡     | **Versioning done:** version snapshots (`definitionSnapshot`, `stepsSnapshot`, `parentVersionId`), append on save/update/promotion, stale `basedVersionId` guard, runs pin `versionId`. **Contract unwired:** no `@repo/contracts` import — runtime is legacy `TestStep` (single `selector`, `TestAction` only), so `alternates`/`intent`, `api.request`, `{{var}}`, and data tables don't exist in the executed model |
| **A1 — Ingest & trigger** | `POST /v1/runs` (plan naming; today's route is `POST /v1/execution/:testId/run`): auth + quota → dedupe on `Idempotency-Key` → insert run + outbox in one transaction → enqueue → `202 {runId}` under 50 ms; suite fan-out + aggregator                | 🟡     | the `202 { runId, status: 'QUEUED' }` contract exists; no quota, idempotency, outbox, or enqueue                                                                                                                                                                                                                                                                                                                       |
| **A2 — Dispatch**         | priority, tenant caps, sharding across e2e/api queues; independent browser/API scaling                                                                                                                                                                 | ⬜     | —                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **A3 — Execution**        | `runner-e2e` (warm Chromium pool, per-test context, trace.zip/screenshots/HAR → S3); `runner-api` (HTTP + JSONPath/JSON-Schema); shared `step-engine` registry                                                                                         | 🟡     | Playwright UI steps run in-process inside the gateway; no `step-engine`, no `runner-api`, no artifact capture                                                                                                                                                                                                                                                                                                          |
| **A4 — Reliability**      | state machine `queued → leased → running → passed \| failed \| recovered \| errored \| timed_out \| cancelled`; classified retries; heartbeats + re-lease; idempotent events on `(runId, attempt, stepOrder)`; cooperative cancel; DLQ; `run_attempts` | ⬜     | `test-step-attempt` exists as the seed; no retry/heartbeat/DLQ machinery                                                                                                                                                                                                                                                                                                                                               |
| **A5 — Tracking**         | RunEvents → Redis Stream → gateway SSE + batched persistence; HMAC webhooks with retries; GitHub/GitLab status checks; rollups for pass/duration/flake                                                                                                 | 🟡     | trace rows persist and the dashboard polls; no stream, SSE, webhooks, or rollups                                                                                                                                                                                                                                                                                                                                       |
| **A6 — Scale**            | KEDA on queue depth; fixed browser contexts per pod; suite sharding; capacity plan from measurements; load-test the trigger path first                                                                                                                 | ⬜     | —                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Pipeline B — AI milestones

| Milestone                   | Scope                                                                                                                                                    | Status | Where it stands                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **B0 — LLM gateway**        | one `LlmPort`: provider routing, structured output, retry/timeout, per-tenant token budgets, response cache, PII redaction, `llm_calls` ledger           | ⬜     | provider clients exist (Groq/Gemini/OpenAI) but are near-duplicate services; no unified port, budgets, cache, or call ledger            |
| **B1 — Authoring**          | async streamed `ai.authoring`: crawl → snapshot → spec generation (OpenAPI/HAR/cURL grounding) → static validation → sandbox dry-run → repair loop       | 🟡     | intent → spec works synchronously; discovery module is a stub; no queue/stream, importers, dry-run, or repair loop                      |
| **B2 — Recovery**           | `RecoveryPort`: pruned accessibility snapshot, ranked candidates, deterministic post-condition verification, `(domHash, intent)` cache, hard time budget | 🟡     | core behavior exists (interactive-primitive snapshot + two-stage verification); missing the formal port, domHash cache, and time budget |
| **B3 — Agentic-primary**    | guarded agent loop with step/token budgets → trajectory compiled into a deterministic TestSpec draft                                                     | 🟡     | agentic flow + guard rails exist; trajectory → spec compiler missing                                                                    |
| **B4 — Evals & guardrails** | golden drift set, shadow runs for prompt/model versions, LLM judge never the sole "pass"                                                                 | ⬜     | —                                                                                                                                       |
| **B5 — Promotion**          | candidate diff, approval appends immutable version, optional per-tenant auto-approve threshold, rejection reasons feed evals                             | 🟡     | diff review + immutable version done; auto-approve policy and eval feedback loop open                                                   |

## UI track

| Capability                                                 | Status | Notes                                            |
| ---------------------------------------------------------- | ------ | ------------------------------------------------ |
| Describe it (intent → editable draft)                      | ✅     | current dashboard flow                           |
| Live run console (deterministic vs agent steps, reasoning) | 🟡     | exists, polls; side-by-side coloring/SSE pending |
| Promotion inbox with locator diff                          | ✅     | approve/reject wired to immutable versions       |
| Record it (browser recorder)                               | ⬜     | —                                                |
| Importers (Postman/OpenAPI/cURL/HAR)                       | ⬜     | —                                                |
| Build it (step palette, UI + API in one timeline)          | ⬜     | —                                                |
| Schema-driven step forms (from zod/JSON Schema)            | ⬜     | —                                                |
| Click-to-assert / click-to-extract                         | ⬜     | —                                                |
| `{{var}}` chips with autocomplete                          | ⬜     | —                                                |
| YAML/JSON code view, two-way sync                          | ⬜     | —                                                |
| Mode switch per test (Deterministic / Hybrid / Agentic)    | ⬜     | —                                                |
| Suites & Schedules, Environments & Secrets, Settings       | ⬜     | —                                                |
| `packages/ui-kit` (replace inline styles)                  | ⬜     | not started                                      |

## Phase details

### Phase 0 — foundation

Done items are summarized; `01.md` §0 has the file-level map.

| Item                                                                                     | Status                       |
| ---------------------------------------------------------------------------------------- | ---------------------------- |
| pnpm + Turborepo monorepo (`pnpm-workspace.yaml`, `turbo.json`)                          | ✅                           |
| `RequestContext` ALS (`@repo/telemetry`) + correlation-id middleware                     | ✅                           |
| `TenantContext` / `TenantDatabaseClient` (`withTenant`, `withSystemAdmin`) in `@repo/db` | ✅                           |
| `JobEnvelope` / `wrapJob` in `packages/queue`                                            | ✅ (helpers only — no queue) |
| TestSpec v1 zod contract in `packages/contracts`                                         | ✅                           |
| JWT auth foundation, global `JwtAuthGuard` + `@Public()`                                 | ✅                           |
| Postgres RLS applied **and enforced** (`tenant-isolation-rls` migration)                 | ✅                           |
| Tenant roles + `current_tenant_id()` defaults (`tenant-roles-and-defaults`)              | ✅                           |
| Per-request tenant connection, `TenantRepositoriesModule`, `TenantScopeInterceptor`      | ✅                           |
| Domain/transport split inside `apps/gateway-api` (eslint-enforced)                       | ✅                           |
| Global exception filters + unit test scaffolding                                         | ✅                           |
| `TEST-RLS-01`, `TEST-RLS-02` verified                                                    | ✅                           |
| `TEST-ALS-01` (ALS propagation test)                                                     | ⬜                           |
| `TEST-SPEC-01` (contract round-trip test)                                                | ⬜                           |
| `LlmPort` (B0)                                                                           | ⬜ carried into Phase 2      |
| `packages/ui-kit`                                                                        | ⬜ carried into Phase 4      |

### Phase 1 — async core (next)

Trigger path (A1) and the worker skeleton (A2/A3) move together so a run can
leave the gateway process:

- [ ] Replace the unawaited in-process run promise with Redis/BullMQ
      (`runs.e2e`, `runs.api`, `ai.authoring`) using `@repo/queue`.
- [ ] Trigger hardening: quota check, `Idempotency-Key` dedupe, run + outbox in
      one transaction, `202` in under 50 ms.
- [ ] Worker-side tenant scope: each job establishes `app.tenant_id` itself
      (`runWithTenant` + `JobEnvelope`); only the gateway does this today.
- [ ] `services/runner-e2e` — Playwright worker; `NoopRecovery` stub first so
      the deterministic pipeline needs no LLM.
- [ ] `services/runner-api` — HTTP-only worker (no browser).
- [ ] `packages/step-engine` — action registry (`ui.*`, `api.*`) shared by both
      runners. Absent today.
- [ ] Run state machine (`queued → leased → running → terminal`) with
      `run_attempts` replacing the in-process notion of an attempt.
- [ ] Run events out via Redis Streams; gateway SSE replaces web polling.
- [ ] `services/ai-service` — `RecoveryPort` implementation with a
      `FakeRunner` for testing without a browser or queue.
- [ ] Spec validator (static) shared with authoring.

### Phase 2 — reliability, authoring, builder

Deterministic (A4, A3, A5 artifacts):

- [ ] Classified retries: infra errors auto-retry with backoff on a new
      attempt; app/assertion failures only when the test opts in.
- [ ] Heartbeats + stalled-lease re-lease; poison DLQ; graceful drain on
      SIGTERM; cooperative cancellation between steps.
- [ ] Event writes idempotent on `(runId, attempt, stepOrder)`.
- [ ] Artifacts: Playwright trace.zip, screenshots, HAR → S3/MinIO (compose
      covers Postgres + Redis only — artifacts have nowhere to go yet).
- [ ] `runner-api` productionized (JSONPath + JSON-Schema assertions).
- [ ] Flake detection derived from attempt history.

AI (B1):

- [ ] `ai.authoring` queue: discovery crawl → site snapshot replacing the
      hardcoded intent-prompt selectors.
- [ ] Grounding from OpenAPI/HAR/cURL; static TestSpec validation; sandbox
      dry-run through the real runner; repair loop; streamed draft to the UI.

UI / platform:

- [ ] Builder with schema-driven forms, click-to-assert/extract, variable
      chips, YAML/JSON toggle, per-test mode switch.
- [ ] Environments & Secrets (encrypted, injected as `{{secret.X}}`).

### Phase 3 — hybrid

Recovery and promotion, re-homed behind the seam. Items already true from v0
are marked so the work reads as wiring, not reinvention:

- [x] Two-stage recovery gate: candidate presence **and** a real
      `toContainText`/visibility post-condition; presence-only proposals fail
      with `RECOVERY_VALIDATION_FAILED`.
- [x] DOM snapshot limited to visible, in-viewport interactive primitives
      (not the first 80 `[id], [class]` matches).
- [x] Promotion inbox with diff; approval appends a new immutable
      `TestVersion` (never mutates `test_steps`).
- [ ] Deterministic locator ladder: primary → `alternates` → heuristics →
      only then `RecoveryPort`. Blocks on A0: the runtime persists a single
      `selector`, so `alternates`/`intent` must first be stored and honored.
- [ ] `RecoveryPort` contract wiring between runner and `ai-service`
      (replaces the in-gateway recovery call).
- [ ] Recovery caching keyed by `(domHash, intent)` + hard per-call time
      budget; ranked candidates before the LLM chooses.
- [ ] Per-tenant auto-approve threshold (optional policy) on top of the
      human inbox.

### Phase 4 — scale & ecosystem

Deterministic (A6, A5 outbound):

- [ ] Fairness: plan-tier queue sharding; Redis token bucket per tenant for
      max concurrent runs; over-cap jobs re-delayed, never blocking the queue
      head.
- [ ] Gateway quotas: runs/min, parallel browsers, LLM tokens; per-tenant API
      keys for CI.
- [ ] Autoscaling on queue depth (KEDA), fixed browser contexts per pod,
      suite sharding, measured capacity planning.
- [ ] Outbound webhooks (HMAC-signed, retried) and GitHub/GitLab status
      checks; rollup dashboards (pass rate, duration, flake rate).

AI (B3, B4):

- [ ] Golden drift scenario set; shadow-run new prompts/models before
      rollout; reject LLM-judge-only passes (`goalAchieved` must be backed by
      at least one deterministic assertion).
- [ ] Agentic-primary with step/token budgets; trajectory → deterministic
      TestSpec compiler; rejection reasons feed the eval set.

UI / platform:

- [ ] Browser recorder + importers (Postman/OpenAPI/cURL/HAR); step palette
      shared with API steps.
- [ ] Suites & Schedules, Settings (API keys, webhooks, quotas); `ui-kit`
      replacing inline styles.
- [ ] OpenTelemetry tracing; logging extended with `tenantId`.
- [ ] Evaluate Temporal only if approval waits / long-lived suites demand it —
      BullMQ is enough for v1.

## Pre-migration blockers (Plans.md §8) — all cleared

These had to be fixed _before_ the migration and correspond to the audit
invariants:

| Blocker                                                         | Resolution                                            |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| Request held open for the whole browser run                     | `202` + fire-and-forget execution                     |
| Promotion overwrote `test_steps` in place                       | Immutable `TestVersion` append; runs pin a version    |
| `assertText` read a bare `value` (looked for "undefined")       | `expectedOutcome ?? value`                            |
| Recovery accepted presence without asserting the post-condition | Two-stage gate + `RECOVERY_VALIDATION_FAILED`         |
| Snapshot took the first 80 `[id],[class]` matches               | Visible/in-viewport interactive primitives, capped    |
| `synchronize: true` + SQLite                                    | Real migrations, `synchronize: false`                 |
| No tenant concept; auth guards unapplied                        | Postgres RLS + global `JwtAuthGuard` with `@Public()` |

## Do not "fix" toward the target

The in-process promise run, the single-process topology, and the empty
services are mid-migration state, not defects to clean up opportunistically.
If a task touches them, note it; change them only when the task says so.
See [AGENTS.md](AGENTS.md) for the in-flight-state caveats.

## Protected invariants

AUDIT-01..07 are fixed and must not regress: assertion text resolution
(`expectedOutcome ?? value`), two-stage recovery validation,
immutable-version promotion, DOM-snapshot interactive-primitive query, `202`
run start, global `JwtAuthGuard` with `@Public()`, and `synchronize: false`.
Details in [AGENTS.md](AGENTS.md), and topic guides under [docs/](docs/).
