/**
 * Minimal shape needed to resolve assertion text. `TestStep`'s
 * `expectedOutcome` is non-nullable in the entity, but legacy/hand-built step
 * payloads (LLM output, JSON snapshots) can omit it, hence the nullish type.
 */
export interface AssertionTextSource {
  expectedOutcome?: string | null;
  value?: string | null;
}

/**
 * Resolve the text an assertion step must match.
 *
 * Invariant: `expectedOutcome ?? value` — never a bare `value`:
 * - `expectedOutcome` is authoritative whenever it is present;
 * - `value` is a legacy fallback only when `expectedOutcome` is genuinely
 *   nullish, not when it is blank;
 * - a blank result is returned as-is so the caller fails loudly
 *   ("no expected text defined") instead of asserting on unrelated input.
 */
export function resolveExpectedText(step: AssertionTextSource): string {
  return step.expectedOutcome ?? step.value ?? '';
}
