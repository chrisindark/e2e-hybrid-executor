E2E Pipeline Plan: Deterministic and AI Pipelines for a Multi-Tenant Test Platform
1. The seam between the two pipelines

Most of this plan comes down to one decision: the two pipelines share contracts and nothing else. They never import each other.

Contract	Owner	Direction
TestSpec v1 (zod → JSON Schema)	packages/contracts	The AI pipeline produces it; the deterministic pipeline consumes it
RunJob / RunEvent	packages/contracts	The deterministic pipeline produces them; the UI and AI pipeline consume them
RecoveryPort (request(stepCtx) → proposal)	packages/contracts	The runner calls it; the AI service implements it
PromotionCandidate	packages/contracts	The AI pipeline produces it; a human or policy approves it, which creates a new test version

Each side ships with a stub of the other. The runner uses NoopRecovery, so you can build the entire deterministic pipeline with no LLM. The AI service gets a FakeRunner that only validates specs and replays recorded DOM fixtures, so you can build it with no queue or browser.

UI / CI / Schedule ─▶ gateway-api ──202 + runId──▶ Postgres (runs, outbox)
                          │ enqueue
                          ▼
                 Redis/BullMQ:  runs.e2e | runs.api | ai.authoring
                          │
          ┌───────────────┴───────────────┐
    runner-e2e (Playwright)         runner-api (HTTP)
          │ step fails & mode=hybrid
          └──▶ RecoveryPort ──▶ ai-service (LLM gateway, budgets, cache)
          │
   RunEvents ─▶ Redis Stream ─▶ gateway SSE ─▶ UI        Artifacts ─▶ S3
2. Monorepo layout
apps/
  web/              Next.js builder + run console
  gateway-api/      NestJS: auth, tenants, test CRUD, trigger, run queries, webhooks (never executes tests)
services/
  runner-e2e/       Playwright worker
  runner-api/       HTTP-only worker (no browser, 10x cheaper per test)
  scheduler/        cron, CI webhooks, suite fan-out
  ai-service/       authoring, recovery, agentic-primary, evals
packages/
  contracts/        TestSpec, events, ports
  step-engine/      action registry (ui.*, api.*), shared by both runners
  db/               migrations + tenant-scoped repositories
  queue/            BullMQ wrappers, job envelope, idempotency, heartbeat
  telemetry/        your correlation-ID/ALS logger, extended with tenantId + OTel
  ui-kit/           design system

Four deployables is enough. Keep the gateway as a modular monolith rather than splitting it further. Your root package.json uses npm workspaces while the docs say pnpm, so pick pnpm and add pnpm-workspace.yaml plus Turborepo.

Infrastructure:

Postgres with row-level security replaces SQLite.
Redis with @nestjs/bullmq replaces the unused @nestjs/bull.
S3 or MinIO holds artifacts.
OpenTelemetry handles tracing.
If workflows get long-lived later (approval waits, multi-stage suites), evaluate Temporal. BullMQ is enough for v1.
3. Multi-tenancy (platform track)
Every table has tenant_id. RLS policies read current_setting('app.tenant_id'), set with SET LOCAL per transaction. Extend your RequestContext AsyncLocalStorage with tenantId and actorId. Job payloads carry both, so workers set the same context.
Fairness:
Queues are sharded by plan tier (runs.e2e.pro, runs.e2e.free).
A Redis token bucket gives each tenant a max concurrent runs cap.
A tenant that exceeds its cap has jobs re-delayed rather than blocking the queue head.
Gateway rate limits and quotas cover runs per minute, parallel browsers, and LLM tokens.
API keys are scoped per tenant, for CI use. Secrets are encrypted per tenant and injected into runs as {{secret.X}}, never stored in the spec.
4. Pipeline A: Deterministic

A0 – Spec and contracts. TestSpec is a discriminated union of steps:

ts
Step =
 | { type:'ui.click'|'ui.fill'|'ui.goto'|'ui.assertText'|'ui.assertVisible',
     locator:{ primary:string, alternates:Locator[], intent:string }, value?:string, expect?:string }
 | { type:'api.request', method, url, headers, body,
     extract:[{ var, jsonPath }], assert:[{ path, op, expected }|{ schemaRef }] }
Variables are chained with {{var}}, and data-driven tables are supported.
Locators store alternates (role, test-id, text) plus the step’s intent. That gives a free first-tier self-heal ladder, so most drift is fixed deterministically before any LLM is called: primary → alternates → heuristics → RecoveryPort.
Tests are immutable versions (test_versions). A run pins a version_id.

A1 – Ingest and trigger (hot path). POST /v1/runs does five things:

Authenticates and checks quota.
Dedupes on Idempotency-Key.
Inserts the run as queued, plus an outbox row, in one transaction.
Enqueues the job.
Returns 202 {runId} in under 50 ms.

A suite trigger fans out one job per test (a test is the unit of retry), plus an aggregator run.

A2 – Dispatch. Priority, tenant caps, and sharding across the e2e and api queues. Browser tests and API tests scale independently.

A3 – Execution.

runner-e2e keeps a warm Chromium pool, one context per test, and records Playwright trace.zip, screenshots, and HAR to S3.
runner-api uses plain HTTP with JSONPath and JSON-Schema assertions.
Both use the shared step-engine registry, so adding a step type is one file.

A4 – Reliability.

Run state machine: queued → leased → running → passed | failed | recovered | errored | timed_out | cancelled.
Retries are classified. Infra errors (browser crash, OOM, stalled lease) retry automatically with backoff on a new attempt. App or assertion failures do not retry unless the test opts in. Flaky detection is derived from attempt history.
Workers send heartbeats and stalled jobs are re-leased.
Event writes are idempotent on (runId, attempt, stepOrder), so a retry can’t duplicate trace rows.
Cancellation is cooperative, checked between steps. There is a DLQ for poison jobs and graceful drain on SIGTERM.
Your unused StepAttempt entity becomes the real run_attempts table.

A5 – Tracking. Each step emits RunEvents to a Redis Stream, which the gateway relays as SSE for live view and persists in batches. Outbound webhooks (HMAC-signed, retried) and GitHub/GitLab status checks. Rollups feed dashboards for pass rate, duration, and flake rate.

A6 – Scale. Autoscale workers on queue depth (KEDA) and keep each pod to a fixed number of browser contexts. For suites, shard across workers. Capacity-plan from measured numbers, not guesses. Load-test the gateway trigger path first, since it should be the cheapest part.

5. Pipeline B: AI / non-deterministic

B0 – LLM gateway. Replace OpenAIService and GeminiService (near-duplicate APIs) with one LlmPort: provider routing, structured output, retry and timeout, per-tenant token budgets, response caching, PII redaction, and an llm_calls table logging prompt version, tokens, latency, and cost.

B1 – Authoring (async, streamed). Queue ai.authoring.

Discovery crawls the target and builds a site snapshot. Your discovery stub already sketches this. It replaces the hardcoded Sauce Demo selectors in the intent prompt.
The LLM generates a spec, with the user’s OpenAPI/HAR/cURL as grounding for API tests.
Static validation against the TestSpec schema.
A sandbox dry-run through the real runner.
A repair loop, then the draft is returned to the UI.

B2 – Recovery (sync, latency-critical). This is the RecoveryPort implementation:

Send a pruned accessibility-tree snapshot (visible interactive elements only) instead of the first 80 [id]/[class] nodes.
Rank candidates and have the LLM choose among them.
Verify the chosen action with a deterministic post-condition (URL changed, element present, text matches expect) before reporting recovered.
Cache by (domHash, intent), and enforce a hard time budget.

B3 – Agentic-primary. The loop runs with step and token budgets. It records its trajectory, and a compiler turns that trajectory into a deterministic TestSpec draft. This is the strongest link between the pipelines: the agent explores once, and later runs are deterministic.

B4 – Evals and guardrails.

A golden set of drift scenarios.
Shadow-run new prompt or model versions before rollout.
An LLM judge is never the sole source of “pass”. goalAchieved must be backed by at least one deterministic assertion, which addresses silent passes.

B5 – Promotion. A candidate shows a diff. Approval creates a new immutable test_version rather than mutating steps in place. Optionally auto-approve above a confidence threshold per tenant policy. Rejection reasons feed the eval set.

6. UI: low-code authoring for both test types

Three ways to author, all landing in the same step-list editor:

Describe it. Plain English goes to the AI pipeline, which streams a draft the user edits.
Record it. A browser recorder (extension or remote-browser session) captures UI flows, and Postman, OpenAPI, cURL, or HAR import covers API tests.
Build it. A step palette, with API and UI steps in one timeline.

Key interactions:

Schema-driven forms. Generate each step’s form from its zod/JSON Schema, so adding a step type needs no UI code.
Click-to-assert / click-to-extract. In the API response viewer, click a JSON field to add an assertion or extract it into a variable. In the page preview, click an element to pick a locator.
Variable chips ({{user.token}}) with autocomplete.
Code view toggle (YAML/JSON), kept in two-way sync.
Mode switch per test: Deterministic, Hybrid (fallback on drift), or Agentic.

Screens: Tests, Builder, Live Run Console (deterministic steps vs. agent steps color-coded, with reasoning), Run Report (trace, screenshots), Promotion Inbox (side-by-side locator diff), Suites & Schedules, Environments & Secrets, Settings (API keys, webhooks, quotas). Use Next.js, TanStack Query, shadcn/ui, and SSE. Replace the current inline styles with ui-kit.

7. Build order (three parallel tracks)
Phase	Deterministic	AI	UI / Platform
0 – Foundation	contracts, TestSpec v1, Postgres schema + RLS	LlmPort	pnpm/Turbo, ui-kit, auth + tenant context
1 – Async core	Gateway trigger → queue → runner-e2e; run state machine; events + SSE	Spec validator + fake runner	Test list, run console
2 – Reliability	Retries, heartbeats, idempotent events, artifacts, runner-api	Authoring (intent → spec)	Builder with schema-driven forms
3 – Hybrid	Locator ladder + RecoveryPort wiring	Recovery with verification, caching	Promotion inbox
4 – Scale	Fairness, quotas, autoscaling, webhooks, CI checks	Evals, agentic-primary + compiler	Recorder, importers, schedules
8. Fix these before migrating

These issues in the current code would carry over into the new design:

runTest holds the HTTP request open for the whole browser run. This is the main reason to move to a queue.
Promotion approval overwrites test_steps in place, which causes lost history and irreproducible runs. Introduce versioning.
assertText builds has-text("${step.value}"), but generated and fixture specs put the text in expectedOutcome and leave value empty, so the assertion looks for "undefined".
In recovery, assertText and assertVisible only waitForSelector, and never check the text. That is a silent-pass source.
getInteractiveElementsSnapshot takes the first 80 matches of [id], [class], which is mostly noise.
synchronize: true and SQLite need to become real migrations.
There is no tenant concept anywhere yet, and the auth guards are defined but never applied to the actual routes.
