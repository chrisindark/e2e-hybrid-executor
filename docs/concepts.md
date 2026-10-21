# Concepts

The vocabulary and model of this platform. Architecture context in
[../ARCHITECTURE.md](../ARCHITECTURE.md).

## Intent and TestSpec

An **intent** is plain English ("log in with the seeded user and confirm the
dashboard loads"). The AI pipeline converts it into a **TestSpec v1** — the
contract in `packages/contracts` (`@repo/contracts`, zod → JSON Schema):

- `schemaVersion: 'v1'`, `name`, `targetBaseUrl`, `envVariables`, an ordered
  `steps` list, and `tags`.
- Step types: `ui.goto`, `ui.click`, `ui.fill`, `ui.assertText`,
  `ui.assertVisible`, `api.request`.
- In the contract, UI locators carry a `primary` plus ranked `alternates` and
  a semantic `intent` string — intent is what recovery is designed to reason
  about when the primary locator drifts.
- API steps support variable extraction (`jsonPath` + `fallback`) and
  assertions (`equals`, `not_equals`, `contains`, `greater_than`,
  `less_than`, `schema_valid`).
- `ui.fill` has `masked` for sensitive values.

> **Contract vs runtime (today).** These types describe the target seam, but
> the running gateway does not import `@repo/contracts`. It persists and
> executes the legacy `TestStep` (`action` + a single `selector`) — so
> `api.request`, `alternates`/`intent`, and `envVariables` are not live yet.
> Unifying contract and runtime is milestone A0 in
> [../ROADMAP.md](../ROADMAP.md).

Hybrid = the same step list can mix browser and HTTP steps, so cheap checks go
over HTTP and only genuinely visual checks open a browser (once the API runner
exists).

## Tests, versions, and runs

- A saved test is a **test definition**; its authoritative content is the
  **`test-version` snapshot** (`definitionSnapshot` + `stepsSnapshot`, with
  `parentVersionId` and `versionNumber`). Reads and runs come from the pinned
  version snapshot — the `test_steps` table is write-side/legacy.
- Versions are **append-only.** Every save and every promotion-approval
  appends a new version; promotion refuses to proceed when the test has moved
  on (the `basedVersionId` stale-version guard).
- A **run** records `versionId` at creation and executes that snapshot, so
  later edits cannot change what a run means. (Only a queued record missing
  its `versionId` falls back to the current version.)

### Deterministic assertions

Assertions resolve expected content from `expectedOutcome ?? value` — never a
bare `value` (audit invariant). The _expected_ semantic lives in
`expectedOutcome` when present; a bare `value` would assert whatever the
selector returned. For `assertText`, that text is **literal**: the intent
prompt and fixtures must put the exact element text (e.g. `Swag Labs`) in
`expectedOutcome`, never a prose sentence.

### The two pipelines

| Deterministic                                                | AI                                                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Playwright/HTTP steps run as scripted; produces trace events | Steps produced from intent (Groq parsing); recovery proposals (Gemini); agentic execution flow |
| Needs no LLM                                                 | Needs provider keys                                                                            |

They share **contracts only** (`TestSpec`, `RunEvent`, `RecoveryPort`, promotionCandidate).

## Promotions and recovery candidates

When a deterministic step fails because a locator drifted, recovery is a
**two-stage gated** process (audit fix): (1) candidate presence on the page,
(2) a _real post-condition_ — the proposed locator must contain text or visibility
to prove it's the element that does the intended action. A proposal that passes
only presence **fails** with `RECOVERY_VALIDATION_FAILED` (presence alone is a
silent pass, silently approving the wrong element — past bug).

The proposal becomes a **promotion candidate**. A human approves or rejects it
via `/v1/promotion-candidates/:id/decide`. Approval appends a **new test
version** (the old versions are untouched history). Rejection closes the
candidate without touching any version; both outcomes remain auditable.

## Trace events

Each step attempt emits **trace-event** rows (deterministic events plus
agentic LLM reasoning/actions when recovery or agentic-primary flow is on).
The dashboard's run console reads these via `/v1/runs/:runId` and the
execution detail endpoints; there is no streaming today (no SSE, no Redis
Streams yet — polling only). Artifacts (screenshots, snapshots) are planned
for object storage (see [../ROADMAP.md](../ROADMAP.md)).

## Tenancy

Everything above happens inside a **tenant** — enforced at the database by
row-level security, not by app-level filters. RLS context:
`app.tenant_id` GUC set per request by `TenantScopeInterceptor`
(`set_config(..., false)`), GUC default fills `tenantId` columns at insert
time. Request context (`RequestContext` in `@repo/telemetry`) carries
correlationId, tenantId and actorId through guards/middleware.

Details: [tenant-isolation.md](tenant-isolation.md).

## Process model today vs. target

Today: the gateway process runs the test inline (unawaited promise). Target
(see [../Plans.md](../Plans.md)): runs enqueue onto Redis/BullMQ, picked up by
`runner-e2e` / `runner-api` workers, healed by `ai-service`, observed via
Redis Streams → SSE. Until then, everything in this doc describes the
single-process reality.
