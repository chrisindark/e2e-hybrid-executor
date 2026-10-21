/**
 * Turning a step into a sentence a non-technical reader understands.
 *
 * The stored step already has a human-written `description`, but it is useful
 * to restate the mechanics ("types X into Y") so reviewers can see exactly what
 * would be done to their app.
 */

import type { TestStep } from './types';

export function isCheck(step: TestStep) {
  return step.action === 'assertText' || step.action === 'assertVisible';
}

/** The literal text a check step looks for (`expectedOutcome ?? value`). */
export function checkText(step: TestStep) {
  return step.expectedOutcome ?? step.value ?? '';
}

export function describeStep(step: TestStep): string {
  switch (step.action) {
    case 'goto':
      return `Open ${step.value ?? 'the target page'}`;
    case 'click':
      return `Click ${step.selector ?? 'an element on the page'}`;
    case 'fill':
      return `Type “${step.value ?? ''}” into ${step.selector ?? 'a field'}`;
    case 'assertText':
      return `Check that ${step.selector ?? 'the page'} shows “${checkText(step)}”`;
    case 'assertVisible':
      return `Check that ${step.selector ?? 'an element'} is visible`;
    default:
      return step.description;
  }
}

/** Why this step exists, expressed as the question it answers. */
export function stepQuestion(step: TestStep): string {
  if (isCheck(step)) return 'Does the page look right?';

  if (step.action === 'goto') return 'Can the page be reached?';

  return 'Does the interaction work?';
}

/** Fields that differ between two versions of a step. */
export function stepDiffFields(original: TestStep, proposed: TestStep) {
  const fields: Array<{ field: string; before: string; after: string }> = [];
  const pairs: Array<
    [string, string | null | undefined, string | null | undefined]
  > = [
    ['action', original.action, proposed.action],
    ['selector', original.selector, proposed.selector],
    ['value', original.value, proposed.value],
    ['expectedOutcome', original.expectedOutcome, proposed.expectedOutcome],
    ['description', original.description, proposed.description],
  ];

  for (const [field, before, after] of pairs) {
    const left = before ?? '';
    const right = after ?? '';
    if (left !== right) fields.push({ field, before: left, after: right });
  }

  return fields;
}
