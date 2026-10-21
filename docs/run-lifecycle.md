# Run lifecycle

The desired lifecycle — from `202` to a decisive outcome — looks like this:
**create** → **enqueue** → **worker executes steps** → **events** →
**candidate triggered?** → **promotion decision** → final run state.
On the current codebase the middle steps are short-circuited (in-process
execution; no queue). Both are documented so the migration reads as a diff
from here.

## Start the run

`POST /v1/execution/:testId/run` **must** return immediately with

```json
202 { "runId": "<uuid>", "status": "QUEUED" }
```

Invariant (do not undo): the HTTP request **never awaits the browser run**.
The requester (web or CI) follows up via `GET /v1/execution/:runId` or,
today, the persisted-run endpoints. A pinned **`test-version`** is recorded
at creation time — later spec edits cannot affect this run.

## Execution model today (mid-migration)

- The gateway kicks off the run as an **unawaited in-process promise**;
  there is no Redis/BullMQ consumer yet (Redis runs via compose for other
  helpers but is not wired as a queue).
- Therefore the **process privately holds queue semantics**: if it restarts or
  crashes mid-run, the run's state is unrecoverable — a known gap,
  deliberately not "fixed" toward the target until the task explicitly calls
  for it.
- Fire and forget must stay tenant-scoped: the run promise lives under
  `runWithTenant` because a queued job outlives the request's tenant
  `set_config`; details in [tenant-isolation.md](tenant-isolation.md).

## Execution model target

From [Plans.md](../Plans.md):

```
gateway → 202 { runId, status: QUEUED }
       → enqueue onto Redis/BullMQ (runs.e2e | runs.api)
       → runner-e2e (Playwright worker) or runner-api (HTTP worker)
       → RunEvents on Redis Streams → gateway SSE → dashboard
       → artifacts → S3
```

Workers establish their own tenant scope from the `JobEnvelope`
(gateway wiring does not travel through a queue), never serve HTTP, and
never import each other.

## Step execution & attempts

Each step gets a `test-step-attempt` recording what actually happened:
value, locator used when relevant, outcome, timing, error detail when a step
fails. A failed UI step with recovery enabled defers to the recovery
path ([selector-drift-recovery.md](selector-drift-recovery.md)) rather than
immediately ending the run; a failed `api.request` assertion fails the run
deterministically (the deterministic path never calls the LLM — recovery is
the only AI hop inside a deterministic run).

## Terminal states

A run resolves to a terminal state only after all steps have outcomes (or a
step made further steps moot). Because there's no worker today, the
**gateway process** is authoritative for status; when the queue arrives the
worker becomes authoritative and the gateway only reflects reported events —
which is why the persisted-run endpoints (`/v1/runs`, `/v1/runs/:runId`)
already read from the database rather than from process memory, so the
migration does not change that contract.

## Promotions interplay

A recovery candidate produced during a run does not block the run's terminal
state; promotion is a post-run, human-paced step —
[promotion-workflow.md](promotion-workflow.md).

## Diagnostics

`/v1/ping` has deliberate failure routes (`throw-http-error`,
`throw-error`, `throw-unhandled-promise`) to exercise the global filters in
isolation before betting a run on them.
