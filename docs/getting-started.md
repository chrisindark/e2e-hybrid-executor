# Getting started

From zero to a promoted recovery, on the current (mid-migration) architecture.
Commands are documented in detail in [../DEVELOPMENT.md](../DEVELOPMENT.md);
environment variables in [../CONFIGURATION.md](../CONFIGURATION.md).

## 1. Bootstrap

```bash
pnpm install
docker compose up -d                 # Postgres 16 (:5432), Redis 7 (:6379)
cp apps/gateway-api/.env.example apps/gateway-api/.env
cp apps/web/.env.example apps/web/.env.development
# in .env: set JWT_SECRET, GROQ_API_KEY, GEMINI_API_KEY at minimum
pnpm db:migrate                      # applies schema + RLS policies + roles
npx playwright install chromium --with-deps
```

## 2. Boot

```bash
./dev.sh          # gateway-api on :3001, web on :3000
```

Check readiness: `curl http://localhost:3001/health/readiness` (Public,
version-neutral).

## 3. Identity

The dashboard mints its own dev token against `NEXT_PUBLIC_TENANT_ID` — it
**must be a Postgres UUID** or every authenticated request fails with 500
(with a helpful note in the web `.env.example`).

Doing it by hand:

```bash
curl -X POST http://localhost:3001/v1/auth/token \
  -H 'content-type: application/json' \
  -d '{"tenantId":"0f8fad5b-d9cb-469f-a165-70867728950e","actorId":"demo-user"}'
```

Everything below uses `Authorization: Bearer <token from that response>`.

## 4. Intent → structured test

`POST /v1/intent` sends the plain-English intent and target URL to the LLM
(Groq) and returns structured steps (TestSpec v1 shape: `ui.goto`, `ui.click`,
`ui.fill`, `ui.assertText`, `ui.assertVisible`, `api.request`). Save it with
`POST /v1/generation`; the save records an immutable `TestVersion`.

## 5. Run it, watch the trace

```bash
curl -X POST http://localhost:3001/v1/execution/<testId>/run \
  -H "authorization: Bearer $TOKEN"
# → 202 {"runId":"…","status":"QUEUED"}
```

The run executes on the gateway process (in-process, fire-and-forget — there is
no queue yet). Poll `GET /v1/execution/<runId>` or use the dashboard's run
console; trace events accumulate per step (`trace-event` rows).

## 6. Forcing drift (the demo's core)

In the dashboard, pick a step and force UI drift (e.g. rename the target
locator in the DOM). The deterministic step fails; with recovery enabled the
LLM (Gemini) is asked for an alternate locator, which must pass a real
post-condition (`toContainText`/visibility) — presence alone is never
accepted. A failed candidate reports `RECOVERY_VALIDATION_FAILED` on the
trace.

## 7. Promote

`GET /v1/promotion-candidates` → review → either approve with
`POST /v1/promotion-candidates/<promotionId>/decide` (appends a **new
immutable TestVersion**; original steps are never mutated) or reject.
Future runs pin the version current at creation time.
