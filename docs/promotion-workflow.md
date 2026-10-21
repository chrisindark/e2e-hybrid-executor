# Promotion workflow

How a machine-proposed recovery becomes a durable part of a test — with a
human in the loop. See also [selector-drift-recovery.md](selector-drift-recovery.md)
(what produces candidates) and [concepts.md](concepts.md#promotion).

## The rule

**Promotion appends a new immutable `TestVersion`; it never mutates
`test_steps`.** Runs pin a version. This is an audit invariant — the whole
point is that reviewing a candidate means comparing against a history you
cannot break by approving.

## The flow

1. A run hits selector drift; a validated recovery proposal is recorded as a
   **promotion candidate** (`promotion-candidate` entity, the
   `promotion-candidate` domain module).
2. The dashboard's promotion review lists pending candidates
   (`GET /v1/promotion-candidates`) with the proposed step, the original
   step, and the validation evidence from the two-stage gate.
3. A human decides:
   - **Approve** (`POST /v1/promotion-candidates/:promotionId/decide`)
     → a new immutable `TestVersion` is appended with the proposed step
     integrated. The run and the older versions are untouched. Future runs
     pin whatever version is current at creation.
   - **Reject** → the candidate closes without any version change; the
     decision trail remains.
4. Version history (`test-version` rows) is the audit log — why a step
   changed, when, via which candidate.

## Why human-in-the-loop (not auto-promote)

- The two-stage recovery gate proves a proposal resolves and satisfies a
  post-condition — it cannot prove _intent equivalence_ at a semantic level
  (right button, wrong checkout flow, wrong cart).
- A bad auto-promotion poisons every subsequent run of that test, silently;
  a refused candidate costs nothing but one review.

## API surface

| Endpoint                                            | Role                                                   |
| --------------------------------------------------- | ------------------------------------------------------ |
| `GET /v1/promotion-candidates`                      | Pending/decided candidates for the tenant (RLS-scoped) |
| `GET /v1/promotion-candidates/:promotionId`         | One candidate + validation outcome                     |
| `POST /v1/promotion-candidates/:promotionId/decide` | Approve (→ new version) or reject                      |

## Relationship to contract

`PromotionCandidate` is a contract type in `packages/contracts`: the AI
pipeline produces it, and a human (or a policy) decides it. In the target
topology the producing side will be `ai-service`, but the decision side —
and the append-only version semantics — stay in the gateway/domain layer
exactly as today.
