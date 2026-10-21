# Trace events

How a run's behavior is recorded and read. Consumers: the dashboard run
console, the promotion-review screen, and the recovery path (the LLM sees the
trace, not raw DOM blobs).

## What exists

- `trace-event` entity in `src/shared/trace-event.entity.ts`, produced by the
  `trace-event` domain module (`src/modules/trace-event`) and read through
  tenant-scoped repositories.
- Every step attempt writes events; so do recovery hops and the agentic flow
  when it is in play. Deterministic runs produce deterministic events only;
  nothing calls the LLM unless recovery or agentic-primary is triggered.
- Traces are per-tenant rows (RLS), queried and owned like any domain object —
  the API surface is `GET /v1/runs/:runId` and
  `GET /v1/execution/:runId` (see [../API_REFERENCE.md](../API_REFERENCE.md)).

## Events to look for

| Event family                    | Meaning                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Deterministic step start/finish | The scripted Playwright/HTTP path, including assertion outcomes (`expectedOutcome ?? value` semantics)                  |
| Step attempt failure            | Linked `test-step-attempt` with error detail                                                                            |
| `RECOVERY_VALIDATION_FAILED`    | A recovery _proposal_ failed its second-stage post-condition — the recovery did **not** silently pass (audit invariant) |
| Agentic events                  | LLM reasoning/actions when recovery or the agentic-primary flow was engaged                                             |

## Consumers today

- The web polls — **no SSE, no Redis Streams yet**. The gateway process
  writes rows and the dashboard polls after some interval; latency between a
  step and its visibility in the UI is messaging-free today and bounded only
  by poll cadence.
- The trace feed is also the only artifact story: the DOM snapshot used by
  recovery is derived live, not persisted to object storage (artifacts →
  S3/MinIO is planned; see [../ROADMAP.md](../ROADMAP.md)).

## Recovery's DOM snapshot

The snapshot the recovery LLM receives is not raw HTML: it **queries
interactive primitives** (inputs, buttons, links, selects, etc.), filters
to nodes that are visible and in-viewport, then caps the result. Two
reasons, both intentional (audit-fixed; do not revert to `[id], [class]`):

1. Token/context economy — the LLM reasons about _actionable_ elements.
2. Exposure control — fewer page internals leave the process
   ([/SECURITY.md](../SECURITY.md#llm-data-exposure)).

## Target state

`RunEvents` will flow onto Redis Streams consumed by the gateway for an SSE
channel to the UI, with artifacts lifted to S3. The event taxonomy above is
intended to survive that migration unchanged — it is the payload, and the
transport is what changes.
