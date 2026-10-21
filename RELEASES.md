# RELEASES

The repo is pre-release (`private: true`, no git tags yet). This doc defines
how releases will be cut once publishing starts; today it serves as the
process baseline.

## Versioning

- Semantic versioning. `0.x` signals pre-1.0 instability where breaking
  changes are expected; `1.0` is reserved for the target topology (queue,
  workers, four deployables) actually working end to end.
- The deployable apps each carry their own version in their `package.json`
  (`gateway-api` starts at `0.1.0`).

## Release process (when it begins)

1. Ensure `FEATURES`/`FIXES` accumulated under **Unreleased** in
   [CHANGELOG.md](CHANGELOG.md) are complete for this cut.
2. Run the full gate: `pnpm run build && pnpm run lint` and per-app
   `pnpm run check` (format + lint + build + tests). E2E suite:
   `pnpm run test:e2e` in `apps/gateway-api`.
3. Verify a clean checkout bootstraps: `pnpm install` (lockfile committed),
   migrations `pnpm db:migrate` apply on an empty database, `./dev.sh` boots
   API + web.
4. Bump `package.json` version(s), finalize the CHANGELOG entry
   (`date: YYYY-MM-DD` in the header per [Keep a Changelog](https://keepachangelog.com)).
5. Tag `git tag vX.Y.Z` (tags require the pre-push check to pass).
6. Publish only with a LICENSE chosen and `SECURITY.md` contact path valid.

## Commit conventions feed the changelog

Commits are `type: description` (`feat:`, `fix:`, `chore:`, `refactor:`).
`feat`/`fix` entries must arrive in the CHANGELOG's Unreleased section in the
same PR that introduces them; `chore`/`docs` are optional there.

## Branches

- `staging` — integration branch; the current in-flight migration lives here.
- Feature work happens on short-lived branches per PR.

## Compatibility notes for pre-1.0 cuts

- If migrations changed, release notes must state the exact `db:migrate`
  behavior (applied migrations are never edited afterward — they are
  historical records).
- The run-start contract (`202 { runId, status: 'QUEUED' }`), the
  TestSpec v1 schema, and tenant-RLS behavior are public boundaries even
  before 1.0; breaking them requires a CHANGELOG entry under a
  **Breaking Changes** subsection plus a migration/upgrade note.
