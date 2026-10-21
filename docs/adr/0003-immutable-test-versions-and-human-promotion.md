# ADR 0003: Immutable test versions with human-approved promotion

- **Status:** Accepted (enforced by behavior + tests)
- **Date:** 2026 (codified by the promotion/recovery audit work)
- **Deciders:** gateway-api maintainers
- **References:** [docs/promotion-workflow.md](../promotion-workflow.md),
  [docs/selector-drift-recovery.md](../selector-drift-recovery.md), audit
  invariant list in [AGENTS.md](../../AGENTS.md)

## Context

The v0 loop edited a saved test's steps in place, and (early on) accepted
LLM-proposed recovery locators that merely _matched an element_, without
proving the element did what the step intended. Two failure modes surfaced:

1. A run could evaluate a moving target: what "the current spec" meant
   changed under the run.
2. An LLM's plausible-but-wrong locator could silently overwrite a real
   assertion target, degrading tests invisibly over time.

## Decision

Three coupled rules, treated as one decision:

1. **Runs pin a version.** A `run` records which `TestVersion` it executes;
   subsequent spec edits cannot affect it.
2. **Tests are append-only.** Saving edits and approving promotions both
   append a new immutable `TestVersion`. `test_steps` is never mutated by
   promotion; history cannot be destroyed by approval.
3. **Recovery is gated, then human-approved.** A proposal must pass a
   two-stage auto-validation (locator presence **and** a real
   `toContainText`/visibility post-condition — presence alone fails with
   `RECOVERY_VALIDATION_FAILED`), and it still doesn't reach the spec
   automatically: a human decides via promotion candidates. Because
   validation proves _resolves-and-satisfies_, not _intent equivalence_, the
   human remains the promotion authority.

## Consequences

- Traces stay meaningful forever (a run means a fixed version); re-reading
  history answers "what was this run actually checking?"
- Bad recoveries cost one review, not a silent degradation curve.
- Version-list growth is the explicit cost; acceptable while versions are
  few, and a candidate for compaction policy later (not decided here).
- The enforcement tests live with the promotion and recovery modules; the
  invariants list in `AGENTS.md` keeps "simplifications" (e.g. mutate now,
  version later; presence-only acceptance) from regressing.
