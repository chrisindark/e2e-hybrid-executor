# ADR 0002: Domain/transport seam inside the gateway process

- **Status:** Accepted (lint-enforced)
- **Date:** 2026 (commit `569c579 refactor(gateway-api): split domain modules from the HTTP entry point`)
- **Deciders:** gateway-api maintainers
- **References:** [ARCHITECTURE.md](../../Architecture.md) "Domain layout",
  `apps/gateway-api/eslint.config.mjs` (`no-restricted-imports`)

## Context

In the v0 layout, controllers lived beside their services: business logic was
one refactor away from depending on HTTP DTOs, framework decorators, and
transport shapes. That coupling becomes expensive when (a) the same services
must be callable from BullMQ workers (`packages/queue` exists precisely so
the queue can call domain work without HTTP), and (b) the modular monolith
is meant to split into deployables later without rewriting inputs.

## Decision

Inside `apps/gateway-api`, the seam is **HTTP → domain only, one way**:

- `src/modules/<feature>/**` holds transport-agnostic business logic
  (services + Nest modules, no controllers, **no HTTP DTOs**). It receives
  plain input types.
- `src/apps/mainApp/**` owns the HTTP shell: `MainAppModule`, controllers,
  DTOs. Controllers translate HTTP → domain input types and back.
- Cross-cutting pieces (guards, filters, config, database wiring, shared
  entities) sit in peer directories, imported by both sides, owned by
  neither.
- Result: domain logic is already queue/trigger-agnostic, which is why the
  planned `runner-*` workers can consume the same core without an HTTP hop.

## Enforcement

A `no-restricted-imports` rule in `apps/gateway-api/eslint.config.mjs`
bans `src/modules/**` (and siblings) from importing `src/apps/mainApp/**`
(controllers/DTOs). The lint failure — not review — is the enforcement
mechanism.

## Consequences

- New transport (queue consumers, CLI, webhooks) plugs in by writing another
  thin adapter against the same modules.
- During migration, some era-skew is visible: features were refactored
  domain-first as they were touched; the direction rule (HTTP may import
  domain; domain may never import HTTP back) is the invariant that all
  remaining `forFeature`-vs-module movement collapses to.
- The NestJS "one module directory per feature with controllers" idiom
  applies to packages _outside_ this seam only.
