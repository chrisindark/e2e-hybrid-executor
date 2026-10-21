# CONFIGURATION

All runtime configuration comes from environment variables, loaded through
`@nestjs/config` (gateway) and Next.js conventions (web). Only `.env.example`
files are tracked; never commit `.env*` with real values.

## Gateway — `apps/gateway-api/.env.example`

| Variable                            | Example                                                   | Purpose                                                   | Notes                                                                                                    |
| ----------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                          | `development`                                             | Standard Nest env                                         |                                                                                                          |
| `APP_NAME`                          | `gateway-api`                                             | Service identity in logs                                  |                                                                                                          |
| `APP_PORT`                          | `3001`                                                    | HTTP listen port                                          | bootstrap default `3001`                                                                                 |
| `APP_ADDRESS`                       | `0.0.0.0`                                                 | Bind address                                              |                                                                                                          |
| `JWT_SECRET`                        | long random string                                        | HS256 shared by `POST /v1/auth/token` and `JwtAuthGuard`  | Rotating it invalidates every issued token                                                               |
| `JWT_TOKEN`                         | (optional)                                                | Static token for tooling                                  |                                                                                                          |
| `DATABASE_URL`                      | `postgresql://orchestrator:…@localhost:5432/orchestrator` | **Owning role** for migrations/DDL                        | Use for `psql` admin work, never for runtime traffic                                                     |
| `DATABASE_APP_URL`                  | `postgresql://app_runtime:…@localhost:5432/orchestrator`  | Runtime connection as **non-superuser**                   | Falling back to `DATABASE_URL` disables RLS if that role is a superuser; `PostgresService` warns at boot |
| `APP_DB_PASSWORD`                   | —                                                         | Password the tenant-roles migration sets on `app_runtime` | Keep in sync with `DATABASE_APP_URL`                                                                     |
| `REDIS_URL`                         | `redis://localhost:6379`                                  | Redis endpoint                                            | Compose up Redis; no queue is wired yet                                                                  |
| `CORS_ORIGIN_WHITELIST`             | `http://localhost:3000`                                   | Comma-separated allowed origins                           | Empty ⇒ no extra origins                                                                                 |
| `CORS_ALLOW_METHODS`                | `GET,POST,PUT,PATCH,DELETE`                               | Comma-separated methods                                   | Empty ⇒ none                                                                                             |
| `OPENAI_API_KEY` / `OPENAI_API_URL` | —                                                         | OpenAI-compatible provider                                | Alternative provider for authoring                                                                       |
| `GROQ_API_KEY` / `GROQ_API_URL`     | —                                                         | Intent parsing (e.g. `llama-3.3-70b-versatile`)           | Fast structured extraction                                                                               |
| `GEMINI_API_KEY`                    | —                                                         | Agentic recovery (e.g. `gemini-2.5-flash`)                | DOM analysis + self-healing                                                                              |

## Web — `apps/web/.env.example`

| Variable                | Purpose                                           | Notes                                                                                                                                                          |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`   | Gateway base URL                                  | Local: `http://localhost:3001`                                                                                                                                 |
| `NEXT_PUBLIC_TENANT_ID` | Tenant id the web app mints its dev token against | **Must be a Postgres uuid.** A slug like `tenant-demo` makes every authenticated request fail with 500 (invalid uuid); RLS policies compare it to uuid columns |
| `NEXT_PUBLIC_ACTOR_ID`  | Actor recorded in `RequestContext`                | `demo-user` locally                                                                                                                                            |

## Two database URLs — why

Postgres RLS is the tenancy boundary, and it only applies when the connection
is not a superuser:

- `DATABASE_URL` = **owner/DDL role**. Only `packages/db` migrations (and
  admin `psql`) use it.
- `DATABASE_APP_URL` = **`app_runtime`, non-superuser LOGIN**. All runtime
  traffic flows through it so `FORCE ROW LEVEL SECURITY` actually applies.
  `FORCE ROW LEVEL SECURITY` still does **not** apply to a superuser — running
  the app as `orchestrator` silently turns every policy into a no-op.

## CORS & helmet

`main.ts` applies helmet with HSTS (2-year max-age, subdomains, preload,
`same-site` COOP), then `enableCors` from the whitelist variables. Origins are
split on commas; an empty list means no cross-origin browser traffic.

## Validation

The global `ValidationPipe` runs with `whitelist: true`,
`forbidNonWhitelisted: true`, `transform: true` (implicit conversion enabled) —
unexpected body properties are rejected outright.

## Local Postgres/Redis

`docker-compose.yml` starts `postgres:16-alpine` (orchestrator/orchestrator
superuser for DDL) and `redis:7-alpine`. `app_runtime` is created by the
tenant-roles migration, not by compose.
