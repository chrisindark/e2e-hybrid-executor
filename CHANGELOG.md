# CHANGELOG

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [RELEASES.md](RELEASES.md) (SemVer; currently pre-release).

This file is a summarized reconstruction from git history up to October 2026;
details live in the commits themselves.

## [Unreleased]

### Added

- Tenant isolation with Postgres RLS: `tenant-isolation-rls` migration
  (tables, policies, `current_tenant_id()`), `tenant-roles-and-defaults`
  migration (roles + `current_tenant_id()` defaults on every `tenantId`).
- Request-scoped tenant wiring in `apps/gateway-api/src/database/`:
  `TenantScopeInterceptor`, `TenantRepositoriesModule`, `TenantTransactionService`,
  per-request tenant connection, `runWithTenant` for fire-and-forget runs.
- Domain/transport split inside `apps/gateway-api`: business logic moved to
  `src/modules/**` (no controllers/DTOs), HTTP wiring isolated in
  `src/apps/mainApp/**`; enforced by a `no-restricted-imports` eslint rule.
- Global exception filters (`AllExceptionsFilter`, `HttpExceptionFilter`) and
  unit test scaffolding (`jest.unit.config.ts`).
- Redis 7 in `docker-compose.yml` alongside Postgres 16 (queue wired later).

### Changed

- Restructured into a pnpm/Turborepo monorepo with `@repo/*` workspace
  packages (`contracts`, `db`, `queue`, `telemetry`, `types`).
- Runtime Postgres traffic must connect as the non-superuser `app_runtime`
  role (`DATABASE_APP_URL`) so RLS is enforced; migrations keep using the
  owning role (`DATABASE_URL`).
- Application routes are URI-versioned under `/v1`.

### Fixed

- Duration handling: round decimals before inserting durations into Postgres.

### In progress / scaffolding (not functional yet)

- `services/runner-e2e`, `runner-api`, `ai-service`, `scheduler` and
  `packages/step-engine`, `ui-kit` are plan scaffolding — see
  [ROADMAP.md](ROADMAP.md).

## [0.1.0] — initial (pre-migration loop)

### Added

- The v0 loop: plain-English intent → LLM-generated Playwright steps →
  deterministic run with trace events → selection-drift recovery (Gemini) →
  promotion candidate review (approve/reject).
- Intent parsing via Groq (`llama-3.3-70b-versatile`), agentic recovery via
  Gemini (`gemini-2.5-flash`).
- NestJS API (`apps/gateway-api`) with JWT auth, and the Next.js 14 dashboard
  (`apps/web`) for intent capture, saved tests, run traces, promotion review.
- ADRs for foundational decisions — see `docs/adr/`.
