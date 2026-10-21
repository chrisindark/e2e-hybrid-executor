# Selector drift & recovery

What happens when the DOM stops matching a saved step locator. The invariants
here are audit fixes — treat them as protected (see [../AGENTS.md](../AGENTS.md)).

## Drift, the concrete problem

A test saved as _click the button labeled "Checkout"_ can break when the
app renames that button. In the target contract the step carries a semantic
`intent` ("what this action is for") plus a `primary` locator and ranked
`alternates`, so a deterministic ladder can try alternates before any LLM
call. **Today the runtime steps carry `description` + a single CSS
`selector`** — the alternates/intent ladder is Phase 3 work; recovery
currently reasons from the DOM snapshot and the step's description.

## Recovery is a two-stage gate (do not weaken)

When a UI step fails and recovery is enabled, an LLM (Gemini) proposes an
alternate locator. The proposal is accepted only if **both** stages pass:

1. **Presence** — the proposed locator actually resolves to an element.
2. **Real post-condition** — the resolved element passes the semantic check
   implied by the step: `toContainText` for text-bearing actions,
   visibility checks for interactive elements.

If only stage 1 passes, the recovery **fails** with
`RECOVERY_VALIDATION_FAILED` on the trace. Presence alone is a silent pass —
it would approve an element that merely _exists_, not the element _that does
the intended action_. This is the single most important invariant in the
recovery path.

## What the LLM sees

The DOM snapshot given to recovery is derived, not raw:

- Queries **interactive primitives** (buttons, inputs, links, selects) —
  not `[id], [class]`.
- Filters to **visible and in-viewport** nodes.
- Capped in count.

Never revert this to a coarse selector dump — it exists for context economy
and to limit what page content leaves the process to provider APIs
([../SECURITY.md](../SECURITY.md#llm-data-exposure)).

## Provider split

Intent parsing and agentic flows have historically been split by model
strength:

- **Groq** (`llama-3.3-70b-versatile` class) for fast structured extraction
  (intent → steps).
- **Gemini** (`gemini-2.5-flash` class) for recovery/agentic reasoning over DOM
  snapshots.

Keys: `GROQ_API_KEY`(+URL), `GEMINI_API_KEY`, `OPENAI_*` as alternative
provider ([../CONFIGURATION.md](../CONFIGURATION.md)).

## Where the proposal goes

A validated proposal does **not** silently rewrite the test. It becomes a
**promotion candidate** for human review —
[promotion-workflow.md](promotion-workflow.md). Until a human approves, the
saved spec keeps the original locator; the recovery happened _inside the
run_, not in the definition.

## Guard rails in the agentic path

The agentic flow (beyond single-step recovery) runs with explicit guard
rails: limited steps per agentic session, action history maintained, and a
confirmation step before anything becomes a test definition. Recoveries
reuse these rails so a hallucinated locator chain can't run away.

## Planned changes

`RecoveryPort` (`packages/contracts`) formalizes this exchange for the
worker topology — the runner calls it, `services/ai-service` implements
it, and a `NoopRecovery` stub lets the deterministic pipeline run without
any LLM at all ([../ROADMAP.md](../ROADMAP.md)).
