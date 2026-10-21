# ADR 0001: Multi-tenant isolation via Postgres Row-Level Security

- **Status:** Accepted and applied
- **Date:** 2026 (applied migrations `1792066610064`, `1792069042212`)
- **Deciders:** platform engineering (this repo)
- **References:** `01.md` §2, [Plans.md](../../Plans.md) §3,
  [docs/tenant-isolation.md](../tenant-isolation.md)

## Context

The platform is inherently multi-tenant (tenant-scoped tests, runs, traces,
promotions). Two candidate mechanisms:

1. Application-level filtering — every query carries a manual
   `WHERE tenant_id = :tenantId`, enforced by convention and code review.
2. Database-engine enforcement — Postgres RLS policies keyed off a session
   GUC (`app.tenant_id`), with `tenantId` columns that the application
   cannot write at all.

Manual filtering has one property we could not accept: it fails silently. A
single forgotten `WHERE`, a `forFeature` repository handed back a root
manager, or an injected payload `tenantId` produces cross-tenant data
movement with no error at all.

## Decision

Isolation is enforced by **RLS, not application code**:

- RLS policies on every business table evaluate `current_tenant_id()`;
- `tenantId` columns are `uuid` with `insert:false/update:false` and a
  `DEFAULT current_tenant_id()` — the app physically cannot choose a tenant
  at write time;
- runtime connects as the **non-superuser** `app_runtime` role
  (`DATABASE_APP_URL`); `FORCE ROW LEVEL SECURITY` does not bind superusers,
  so the DDL/owner role is reserved for migrations;
- `TenantScopeInterceptor` is the sole writer of the GUC, using session-scoped
  `set_config(..., false)` on a dedicated connection cleared before release;
  out-of-request work (the fire-and-forget run) uses `runWithTenant`.

Here name is exported — the literal `'app.tenant_id'` is `TENANT_SETTING`
in `@repo/db`, imported by `TenantTransactionService`; applied migrations
keep the literal because they are historical records.

## Consequences

- **Fail closed.** Inserts outside tenant scope fail (`SQLSTATE 42501`); a
  missing scope can never degrade into "see everything."
- Cross-tenant reads look like emptiness, not errors.
- Some plumbing growth: a global tenant-module of wrapped repositories, an
  interceptor that "owns" the GUC, and a superuser check at boot.
- Shared-nothing temptation resisted: the owner role still sees everything by
  design — that's what makes dev/debugging tolerable while keeping runtime
  strict.
