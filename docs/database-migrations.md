# Database

Postgres (16), TypeORM, migrations in `packages/db` (`@repo/db`).
TypeORM `synchronize` stays `false` — schema changes only through
migrations.

## The two connection URLs

| URL                                | Role                            | Who uses it                                                         |
| ---------------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL` (`orchestrator`)    | Owning role: DDL + admin        | `pnpm db:*` commands, `psql` inspections. **Never runtime traffic** |
| `DATABASE_APP_URL` (`app_runtime`) | Non-superuser LOGIN for runtime | The NestJS data source at request time                              |

Why two: RLS policies (tenancy) apply only to non-superusers
(`FORCE ROW LEVEL SECURITY` does not bind superusers), while migrations
need DDL privileges that `app_runtime` deliberately lacks. The
tenant-roles migration creates `app_runtime` with `APP_DB_PASSWORD`.

## Commands

```bash
pnpm db:generate   # generate a migration from entity changes
pnpm db:migrate    # apply up (uses DATABASE_URL)
pnpm db:show       # pending/applied status
pnpm db:rollback   # down the latest
```

Run from the repo root; they wrap `@repo/db` scripts. Only
`apps/gateway-api` and `packages/db` may execute DDL.

## Applied migrations (current)

| Migration                                    | Contents                                                              |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `1792039710322-initial_schema.ts`            | Base business tables                                                  |
| `1792066610064-tenant-isolation-rls.ts`      | Tenant columns/policies, `current_tenant_id()`                        |
| `1792069042212-tenant-roles-and-defaults.ts` | `app_runtime` role; `DEFAULT current_tenant_id()` on every `tenantId` |

Passed migrations are historical records: they keep literals (e.g. the
`'app.tenant_id'` GUC string) even when source code exports a constant
(`TENANT_SETTING` in `@repo/db`) for the runtime side. Editing an applied
migration to "match" source is afoot-wrong — add a new migration instead.

## Entities (one tenant column each)

`tenant`, `test-definition`, `test-step`, `test-version`, `run`,
`test-step-attempt`, `trace-event`, `promotion-candidate` — all in
`apps/gateway-api/src/shared/`. New tables must (a) carry `tenantId`
(insert/update disabled), (b) gain an RLS policy + the tenant default in a
migration, (c) be consumed only via `TenantRepositoriesModule` wrappers.

## Local dev & stray artifacts

- `docker compose up -d` (Postgres 16 + Redis 7).
- A `database.sqlite` may exist in `apps/gateway-api/` from pre-migration
  days — nothing reads it; delete it locally if you like, or leave it if your
  branch's in-flight state depends on it.
- Duck-typing tip: a failing seed/insert that worked "yesterday" and now
  throws `SQLSTATE 42501` almost always means the current tenant GUC wasn't
  set for that connection (outside `TenantScopeInterceptor` or
  `runWithTenant`) [troubleshooting.md](troubleshooting.md).
