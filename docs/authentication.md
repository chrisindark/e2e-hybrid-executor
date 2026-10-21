# Authentication

How requests become identity — and how that identity reaches Postgres.

## The JWT boundary

- `JwtAuthGuard` is registered globally via `APP_GUARD` in
  `apps/gateway-api`. Every route is protected **by default**; per-route
  `@Public()` opts out (health, ping, token minting). Removing the guard is
  not an option — the protected-by-default posture is an invariant.
- Tokens are HS256 signed with `JWT_SECRET`. Rotation invalidates all
  previously issued tokens (that is expected behavior, and why dev secret
  stays dev-only).
- Claims include **`tenantId` (a Postgres uuid) and `actorId`** — the values
  the guard writes into `@repo/telemetry`'s `RequestContext` once verified.

Also present: `basic-auth.guard.ts` and a `static-jwt-auth.guard.ts` for
specific paths/diagnostics (see `/v1/ping/ping-basic-authenticated`).

## Getting a token (today)

`POST /v1/auth/token` (Public) mints a tenant-scoped token for local/dev use:

```json
{ "tenantId": "0f8fad5b-d9cb-469f-a165-70867728950e", "actorId": "demo-user" }
```

`GET /v1/auth/me` echoes back the resolved identity for a sanity check.

The web dashboard does this automatically against `NEXT_PUBLIC_TENANT_ID`.
That value **must be a Postgres uuid** — RLS policies compare it against uuid
columns, so a human-readable slug does not fail auth (the JWT is minted)
but makes every authenticated request 500 with an invalid-uuid error.

## What is NOT here (yet) — honest state

- No identity provider/OIDC integration, no password logins, no real user
  records: the token endpoint is a **dev convenience**, which is exactly why
  `JWT_SECRET` matters and why [ROADMAP.md](../ROADMAP.md) tracks per-tenant
  API keys (for CI) and a production identity story as platform-track work.
- There is no per-tenant rate limiting or secret vault either; those are the
  same phase.

## How identity reaches the database

Auth (HTTP concern) and tenancy (database concern) meet in exactly one
place: the guard/`TenantScopeInterceptor` sequence.

```
bearer token ─▶ JwtAuthGuard verifies HS256 ─▶ RequestContext gets tenantId+actorId
             ─▶ TenantScopeInterceptor set_config('app.tenant_id', …)
             ─▶ queries via TenantRepositoriesModule manager (app_runtime role)
             ─▶ RLS policies compare rows against that GUC
```

Details of the database side (roles, GUC lifecycle, runWithTenant):
[tenant-isolation.md](tenant-isolation.md). The split of authority matters:
the guard decides _who you are_; Postgres decides _what you can touch_. No
application query filters tenants on trust — removing a guard would change
nothing about cross-tenant read capability without also breaking the GUC
propagation, which is a deliberate, test-covered (TEST-RLS-01/02) property.
