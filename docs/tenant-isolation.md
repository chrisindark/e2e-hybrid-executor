# Tenant isolation

How multi-tenancy actually works: Postgres **Row-Level Security**, not
application WHERE clauses. Discretionary tips in [../SECURITY.md](../SECURITY.md) —
this page is the how-it-really-wires guide, with source pointers.

## The three laws (restate — they break subtly)

1. **The app never writes `tenantId`.** Columns are
   `@Column({ type: 'uuid', insert: false, update: false })`; the DB
   `DEFAULT current_tenant_id()` fills them at INSERT time. Making them
   insertable re-opens payload-spoofing of tenant id.
2. **RLS applies only to non-superusers.** `FORCE ROW LEVEL SECURITY` does not
   bind a superuser role. Runtime connects as `app_runtime` via
   `DATABASE_APP_URL`; the boot-time `PostgresService` check warns if the
   runtime role is a superuser (a silently policy-neutral config).
3. **Repositories are always the tenant-bound wrappers.** The global
   `TenantRepositoriesModule` wraps every `@InjectRepository` provider with
   the ALS-bound manager. A direct `TypeOrmModule.forFeature(...)` in a
   feature module would return the root manager and silently drop isolation.

## Request-scoped plumbing (`apps/gateway-api/src/database/`)

| Piece                                                      | Role                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `middleware/correlation-id.middleware`                     | Establishes an anonymous `RequestContext` (from `@repo/telemetry` ALS) — guards run after middleware, so context exists pre-auth                                                                                         |
| `guards/jwt-auth.guard`                                    | Global (APP_GUARD); on bearer-token success it _overwrites_ tenant and actor in `RequestContext`                                                                                                                         |
| `TenantScopeInterceptor` (the only `app.tenant_id` writer) | Opens a dedicated `QueryRunner`, `SELECT set_config('app.tenant_id', :id, false)` (session-scoped), **cleared before the connection is released**                                                                        |
| `TenantTransactionService`                                 | Transactional work sharing the same GUC; GUC name comes from `TENANT_SETTING` exported by `@repo/db` (never re-type the string)                                                                                          |
| `tenant-repository.ts`                                     | The ALS-bound manager wrapper                                                                                                                                                                                            |
| `runWithTenant`                                            | A dedicated, scoped connection for work that outlives the request — the fire-and-forget run promise uses it, because `set_config(..., false)` is session-scoped and the request may have released its connection by then |

Why session-scoped `set_config` instead of `SET LOCAL`: `SET LOCAL` requires
being inside the same transaction — the not-yet-queued run promise long
outlives the request transaction, so `session` scope + explicit clear before
release is the correct hazard tradeoff here.

## The migrations

- `1792066610064-tenant-isolation-rls` — tables, RLS **policies**,
  `current_tenant_id()` function.
- `1792069042212-tenant-roles-and-defaults` — the roles (`app_runtime` LOGIN
  with `APP_DB_PASSWORD`), and the `current_tenant_id()` DEFAULT on every
  `tenantId` column.

Migrations are historical records — the GUC string is inside them as a
literal on purpose; source keeps the exported constant.

## Testing tenant isolation

Verified in-repo by `TEST-RLS-01` and `TEST-RLS-02` (see `01.md` §3.2), which
exercise the policies from the runtime role's perspective. When adding a new
table: it needs the same `tenantId` default + policy in a migration — a table
without RLS is an open cross-tenant hole, and the nearest regression test
will fail closed on insert rather than silently succeeding.

## Observing it live

You can watch the mechanism with `psql $DATABASE_APP_URL` (the app role) —
inserts _inside a tenant scope_ succeed; the same `INSERT` (or any write)
outside scope fails with `SQLSTATE 42501`, and a `SELECT` of another
tenant's rows returns empty instead of erroring. The admin `DATABASE_URL`
shows all tenants' data because that role is the DDL owner and, by design,
bypasses the policies you'd want it to enforce.
