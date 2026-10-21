# Troubleshooting

Symptom-first. Almost every foot-gun in this build comes from the
mid-migration state or a protected invariant being bypassed.

## 500s on _every_ authenticated request from the web app

**Likely:** `NEXT_PUBLIC_TENANT_ID` is not a Postgres uuid (e.g.
`tenant-demo`).

The token mints fine, but RLS policies compare the claim against uuid
columns; the DB rejects. Use a real uuid from the web `.env.example`,
described in [../CONFIGURATION.md](../CONFIGURATION.md).

## `SQLSTATE 42501` on INSERT/UPDATE

**Meaning:** row-level security rejected it — the connection's
`app.tenant_id` GUC wasn't set (or was set to nothing useful).

Checklist:

- Did the write happen inside a flow covered by `TenantScopeInterceptor` or
  `runWithTenant`? A plain repository call outside those writes without
  tenant and fails closed — that is correct behavior, not a bug to route
  around.
- Try to write `tenantId` yourself? Columns are
  `insert: false, update: false` on purpose — remove the field from the
  payload.
- Are you connected as the **owner/superuser** (`DATABASE_URL`)? The owner
  bypasses policies; only `app_runtime` (via `DATABASE_APP_URL`) enforces
  them.

## RLS "isn't doing anything" / cross-tenant data visible at runtime

**Likely:** runtime connected as a superuser (`DATABASE_APP_URL` copied from
`DATABASE_URL`, or the `app_runtime` role was dropped/re-granted as
superuser). `FORCE ROW LEVEL SECURITY` does not bind superusers, so every
policy is a no-op. Fix the role/URL; the boot-time `PostgresService` logs a
warning that points here. See
[../SECURITY.md](../SECURITY.md#runtime-must-not-be-a-superuser).

## `401` on an endpoint you think should be open

Routes are protected **by default**. Public-ness is explicit: `@Public()`.
Health and ping are public; everything else (incl. `/v1/intent`,
`/v1/generation`) needs a bearer token. After `JWT_SECRET` rotation, all old
tokens die — mint again.

## A run "stuck" in QUEUED

Expected-ish today: `202 { runId, status: 'QUEUED' }` starts a
fire-and-forget in-process promise. If the gateway process restarted (or
crashed) after the 202 but before completion, the run has no executor —
there is no queue pickup. This is the known mid-migration gap, tracked as the
first phase-1 item in [../ROADMAP.md](../ROADMAP.md) —
do not patch around it. If the gateway process was up the whole time,
polling will resolve the run; if the process restarted mid-run, the run has
no executor and its state is unrecoverable by design today.

## A recovery candidate was proposed and _looks right_, but got rejected

The two-stage gate failed: the proposed locator matched an element but the
real post-condition (`toContainText`/visibility) didn't hold. Presence-only
approval is the exact bug the gate exists to prevent — look at
`RECOVERY_VALIDATION_FAILED` in the trace, then eyeball the post-condition
the step implies ([selector-drift-recovery.md](selector-drift-recovery.md)).

## Selector looked-up results differ between runs

The DOM snapshot for recovery culls to visible, in-viewport, interactive
nodes and caps the count — same page, deterministic view. If your manual
`document.querySelectorAll('[id],[class]')` disagrees, you are comparing to a
mode the platform deliberately does not use (audit invariant; see
[trace-events.md](trace-events.md#recovery-s-dom-snapshot)).

## Migration fails on `app_runtime`

The role/password are set by the tenant-roles migration, driven by
`APP_DB_PASSWORD`. If `DATABASE_APP_URL` and `APP_DB_PASSWORD` disagree
(rotation in one place, not the other), runtime traffic fails auth — sync
them ([../CONFIGURATION.md](../CONFIGURATION.md)).

## Deliberate error endpoints (to demo filters, not bugs)

`/v1/ping/throw-http-error`, `/v1/ping/throw-error`,
`/v1/ping/throw-unhandled-promise` — wired to exercise the two-stage
exception filter chain (`HttpException` keeps its status; anything else
degrades to the filtered 500).
