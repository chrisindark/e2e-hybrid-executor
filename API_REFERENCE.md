# API REFERENCE

REST API of `apps/gateway-api`. URI versioning with default version `1`, so
application routes are prefixed `/v1` (health and ping are version-neutral).
JSON bodies only; the global `ValidationPipe` whitelists fields and rejects
unknown keys.

Auth: every route requires a tenant-scoped JWT (`Authorization: Bearer …`)
unless marked **Public**. The guard is global; `@Public()` is per-route.
Mint a dev token with `POST /v1/auth/token`. All listing/detail routes are
tenant-scoped by RLS — you only ever see your tenant's rows.

## Health (`/health`, version-neutral) — Public

| Method | Path                | Description            |
| ------ | ------------------- | ---------------------- |
| GET    | `/health/liveness`  | Process is up          |
| GET    | `/health/readiness` | Dependencies reachable |

## Ping (`/v1/ping`) diagnostic surface — Public controller

| Method | Path                                | Description                              |
| ------ | ----------------------------------- | ---------------------------------------- |
| GET    | `/v1/ping`                          | Anonymous context check                  |
| GET    | `/v1/ping/ping-jwt-authenticated`   | Verifies JWT/tenant context              |
| GET    | `/v1/ping/ping-basic-authenticated` | Verifies basic-auth guard path           |
| GET    | `/v1/ping/throw-http-error`         | Deliberate `HttpException` (filter demo) |
| GET    | `/v1/ping/throw-error`              | Deliberate generic error                 |
| GET    | `/v1/ping/throw-unhandled-promise`  | Deliberate unhandled rejection           |
| GET    | `/v1/ping/:id`                      | Echo diagnostic                          |

## Auth

| Method | Path             | Auth   | Description                                                                                                      |
| ------ | ---------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/auth/token` | Public | Mint a tenant-scoped JWT for local/dev use. Body: `{ tenantId: uuid, actorId }`. HS256, signed with `JWT_SECRET` |
| GET    | `/v1/auth/me`    | JWT    | Echo of the authenticated tenant/actor claims                                                                    |

The web app mints its token automatically (see `NEXT_PUBLIC_TENANT_ID` in the
web env — must be a UUID).

## Intent (AI authoring)

| Method | Path         | Auth | Description                                                                            |
| ------ | ------------ | ---- | -------------------------------------------------------------------------------------- |
| POST   | `/v1/intent` | JWT  | Body: `{ intent, targetUrl, … }` → LLM generates structured steps (TestSpec v1 shaped) |

## Tests (`/v1/generation` — saved test definitions)

| Method | Path                     | Auth | Description                                                                         |
| ------ | ------------------------ | ---- | ----------------------------------------------------------------------------------- |
| POST   | `/v1/generation`         | JWT  | Create a test definition (steps are versioned immutably)                            |
| GET    | `/v1/generation`         | JWT  | List saved tests for the tenant                                                     |
| GET    | `/v1/generation/:testId` | JWT  | One test with its current version/steps                                             |
| PUT    | `/v1/generation/:testId` | JWT  | Save changes — appends a new immutable `TestVersion`; `test_steps` is never mutated |

## Execution (trigger)

| Method | Path                          | Auth | Description                                                                                                                      |
| ------ | ----------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/execution/:testId/run`   | JWT  | Start a run of the test's pinned version. Returns `202 { runId, status: 'QUEUED' }` immediately — the browser run is not awaited |
| GET    | `/v1/execution/:testId/rerun` | JWT  | Rerun convenience for the UI                                                                                                     |
| GET    | `/v1/execution`               | JWT  | List executions                                                                                                                  |
| GET    | `/v1/execution/:runId`        | JWT  | Execution detail                                                                                                                 |

## Runs (persisted)

| Method | Path              | Auth | Description                                  |
| ------ | ----------------- | ---- | -------------------------------------------- |
| GET    | `/v1/runs`        | JWT  | List persisted runs (tenant-filtered by RLS) |
| GET    | `/v1/runs/:runId` | JWT  | Run detail incl. step attempts               |

## Promotion candidates (human-in-the-loop review)

| Method | Path                                           | Auth | Description                                                                                                |
| ------ | ---------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| GET    | `/v1/promotion-candidates`                     | JWT  | List pending recovery candidates                                                                           |
| GET    | `/v1/promotion-candidates/:promotionId`        | JWT  | Candidate detail (proposed step, validation outcome)                                                       |
| POST   | `/v1/promotion-candidates/:promotionId/decide` | JWT  | Approve/reject. Approval appends a new immutable `TestVersion`; the original `test_steps` is never mutated |

## Notes

- There are no webhooks, SSE, or queue endpoints yet — the web polls
  `/v1/execution` and `/v1/runs`. This matches the mid-migration state; the
  target adds webhooks in the gateway and event streams from workers
  (see [ARCHITECTURE.md](Architecture.md)).
- A `DELETE` route on `/v1/generation/:testId` exists in source but is
  commented out.
- Errors follow the global filter chain: `HttpException`s keep their status
  (401/400/…); unhandled errors become a 500 via `AllExceptionsFilter`.
  Cross-tenant ids, if reachable at all, resolve to "not found" because RLS
  filters the row — treat 404-style miss as the cross-tenant signal.
