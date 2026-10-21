# SECURITY

## Tenancy is enforced by Postgres RLS, not application code

Every business table carries `tenantId` and an RLS policy evaluating
`current_tenant_id()` (the `app.tenant_id` session setting). The application
never relies on `WHERE tenant_id = :tenantId` for security:

- `tenantId` columns are `@Column({ type: 'uuid', insert: false, update: false })`
  — the app cannot write the tenant; the DB default fills it from
  `current_tenant_id()`. Making it insertable would re-open request-payload
  tenant spoofing.
- Inserts without tenant scope **fail closed** (SQLSTATE 42501 / NOT NULL
  violation).
- `TenantScopeInterceptor` is the only writer of `app.tenant_id`, using a
  session-scoped `set_config(..., false)` on a dedicated `QueryRunner` that is
  cleared before the connection is released. `runWithTenant` scopes the
  fire-and-forget run promise separately.
- Repositories must come from `TenantRepositoriesModule`. A raw
  `TypeOrmModule.forFeature` would hand back the root manager and silently drop
  tenancy.
- Cross-tenant access degrades to emptiness: you cannot select another
  tenant's row, and ids from other tenants look like ordinary 404/empty-list
  responses.

Details: [docs/tenant-isolation.md](docs/tenant-isolation.md) and
[docs/adr/0001-tenant-isolation-with-postgres-rls.md](docs/adr/0001-tenant-isolation-with-postgres-rls.md).

## Runtime must not be a superuser

All runtime traffic connects as `app_runtime` (non-superuser LOGIN) via
`DATABASE_APP_URL`. `FORCE ROW LEVEL SECURITY` does **not** apply to a
superuser, so connecting as `orchestrator` would make every policy a no-op.
`PostgresService` warns at boot if the runtime connection is a superuser.
The DDL role (`DATABASE_URL`) is for migrations and admin `psql` only.

## Authentication

- `JwtAuthGuard` is global via `APP_GUARD`; opt out per-route with
  `@Public()` — never by removing the guard.
- Tokens are HS256, signed with `JWT_SECRET`; rotation invalidates all issued
  tokens.
- `/v1/auth/token` is a dev convenience minting tenant-scoped tokens for local
  use — it is **Public** and assumes `JWT_SECRET` is only strong in real
  deployments. Demand a proper identity provider / per-tenant API keys before
  production (tracked in [ROADMAP.md](ROADMAP.md)).

## Transport & input

- Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` rejects
  unexpected payload fields.
- Helmet with HSTS (2y, preload) and `same-site` cross-origin resource policy.
- CORS is an explicit allowlist from `CORS_ORIGIN_WHITELIST`:
  empty means no browser origins.
- Global exception filters avoid leaking stack traces; `HttpException`s keep
  their semantics, everything else collapses to a filtered 500.

## Secrets & spec hygiene

- Never commit `.env*` (only `.env.example` is tracked). If a key appears in a
  local file, rotate it.
- Secrets never live in `TestSpec` steps; the target design injects
  per-tenant secrets at run time as `{{secret.X}}` variables, encrypted per
  tenant (planned; see [ROADMAP.md](ROADMAP.md)).
- Steps that may contain sensitive values (`ui.fill.masked`) are marked in the
  spec so downstream can mask echoes.

## LLM data exposure

The AI pipeline sends DOM snapshots and step context to provider APIs (Groq for
parsing, Gemini for recovery). Treat the target application's page content as
sensitive: don't point intent/recovery at systems you cannot share with those
providers. The DOM snapshot deliberately strips non-interactive nodes to reduce
context exposure.

## Audit invariants (do not weaken)

The security-relevant audit fixes are invariants, not preferences: two-stage
recovery validation (`RECOVERY_VALIDATION_FAILED`), assertions resolving
`expectedOutcome ?? value`, immutable `TestVersion` promotion with pinned run
versions, the `202` run-start contract, and `synchronize: false`. See
[AGENTS.md](AGENTS.md).

## Reporting

This is a private repo today. For suspected vulnerabilities, do not open a
public issue: contact the maintainers directly (owner of the repository) and
include reproduction steps, affected endpoints, and the tenant-impact analysis
(RLS vs app-level) if applicable.
