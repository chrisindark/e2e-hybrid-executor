/**
 * A glossary of the domain vocabulary, written for someone who does not write
 * code. `InfoHint` and the glossary page render these directly, so the wording
 * here is the single source of truth for "what does this word mean?" copy.
 */

export interface GlossaryEntry {
  term: string;
  /** A five-word max summary for chips and tooltips. */
  short: string;
  /** One or two sentences of plain English. */
  explanation: string;
  /** An optional concrete example. */
  example?: string;
}

export const GLOSSARY = {
  test: {
    term: 'Test',
    short: 'One thing you want checked',
    explanation:
      'A named check for a feature, described in plain English. It has a target page and an ordered list of steps.',
    example: '“A customer can log in with a valid email and password.”',
  },
  step: {
    term: 'Step',
    short: 'One action + what should happen',
    explanation:
      'A single instruction inside a test: something to do (click, type, open a page) plus what the page should do in response.',
    example: 'Click “Sign in”, then expect the text “Welcome back”.',
  },
  action: {
    term: 'Action',
    short: 'What the step does',
    explanation:
      'The verb of a step — open a page, click something, type text, or check that text/a element is there.',
  },
  selector: {
    term: 'Selector',
    short: 'How the step finds an element',
    explanation:
      'The precise “address” the test uses to find one element on the page. When a site is redesigned these break, which is the most common cause of failures.',
    example: '#login-button or [data-testid="submit"]',
  },
  expectedOutcome: {
    term: 'Expected outcome',
    short: 'What “correct” looks like',
    explanation:
      'The condition the test checks after the action. If the page does not match it, the step fails.',
  },
  run: {
    term: 'Run',
    short: 'One execution of a test',
    explanation:
      'Every time a test is executed it produces a run, with a start time, an end time, and a final result: passed, failed, or passed after a fix.',
  },
  traceEvent: {
    term: 'Trace event',
    short: 'A recorded moment in a run',
    explanation:
      'The run’s diary. Each step that executes writes an entry saying what it did, how long it took, and what happened — including the exact error when something broke.',
  },
  mode: {
    term: 'Mode',
    short: 'How much AI is allowed',
    explanation:
      'Controls how the run behaves. “Scripted” follows the steps exactly; “AI rescue” follows them but lets the AI find an alternative if one breaks; “AI-driven” lets the AI plan the steps itself.',
  },
  recovery: {
    term: 'Recovery',
    short: 'The AI found another way',
    explanation:
      'When a scripted step fails, the system can look at the live page, work out why the selector no longer matches, and try a different approach. If that works, the step is marked “recovered”.',
  },
  validation: {
    term: 'Recovery validation',
    short: 'Did the rescue really work?',
    explanation:
      'After finding an alternative element the system still runs the step’s real check. A recovery only counts if that check genuinely passes — finding a lookalike element is not enough.',
  },
  promotion: {
    term: 'Promotion',
    short: 'Accepting a fix into the test',
    explanation:
      'A successful recovery is offered as a suggested edit to the test. Accepting (“promoting”) it saves a new version so future runs use the fixed step. Rejecting it leaves the test untouched. Test history is never overwritten.',
  },
  version: {
    term: 'Version',
    short: 'An immutable snapshot of a test',
    explanation:
      'Each accepted fix creates a new version of the test. Older versions are kept forever so you can see exactly which definition a past run used.',
  },
  intent: {
    term: 'Intent',
    short: 'Your plain-English description',
    explanation:
      'The original sentence you typed to describe the test. It is kept alongside the generated steps so anyone can see what the test was meant to prove.',
  },
  assertion: {
    term: 'Check (assertion)',
    short: 'A pass/fail question',
    explanation:
      'A step that asks a yes/no question about the page, such as “is this text present?”. Checks are what turn an action sequence into a real test.',
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;

export const GLOSSARY_ORDER: GlossaryKey[] = [
  'test',
  'step',
  'action',
  'selector',
  'expectedOutcome',
  'assertion',
  'run',
  'traceEvent',
  'mode',
  'recovery',
  'validation',
  'promotion',
  'version',
  'intent',
];
