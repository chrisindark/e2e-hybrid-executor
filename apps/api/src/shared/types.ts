/**
 * Shared types. These are the contracts every module (intent, execution,
 * agentic-executor, trace, promotion) reads and writes against. Keeping
 * them in one file is what lets us claim the architecture is "honest" —
 * every layer tags its events to the same StepUUID.
 */

export type ExecutionMode =
  'deterministic' | 'deterministic-with-fallback' | 'agentic-primary';

export type StepStatus =
  'pending' | 'running' | 'passed' | 'failed' | 'recovered';

export enum TestAction {
  None = '',
  Goto = 'goto',
  Click = 'click',
  Fill = 'fill',
  AssertText = 'assertText',
  AssertVisible = 'assertVisible',
}

/** A single structured step produced by the intent module. */
export interface TestStep {
  stepId: string; // UUID - the spine. Every trace event references this.
  order: number;
  description: string; // human-readable intent for this step, e.g. "Click login button"
  // action: 'goto' | 'click' | 'fill' | 'assertText' | 'assertVisible';
  action: TestAction;
  selector?: string; // CSS selector, present for deterministic steps
  value?: string; // input value for 'fill' actions
  expectedOutcome: string; // what should be true after this step, in plain English
}

/** A full test, as generated from an intent and potentially updated by promotions. */
export interface TestDefinition {
  testId: string;
  name: string;
  originalIntent: string; // the raw natural-language input from the user
  targetUrl: string;
  steps: TestStep[];
  createdAt: string;
  updatedAt: string;
}

/** One trace event - the atomic unit of the decision trace / run report. */
export interface TraceEvent {
  eventId: string;
  stepId: string;
  runId: string;
  mode: ExecutionMode;
  timestamp: string;
  status: StepStatus;
  durationMs?: number;
  /** What actually happened - selector used, action taken. */
  actionTaken?: string;
  /** For agentic steps: why the agent decided this. Must be present for
   *  any agentic decision - this is the "why" the assignment asks for. */
  reasoning?: string;
  /** Plain-English, non-technical explanation. This is what a release
   *  manager or CTO reads - must never be raw log output. */
  customerExplanation: string;
  error?: string;
}

/** A full run of a test, aggregating trace events. */
export interface Run {
  runId: string;
  testId: string;
  startedAt: string;
  finishedAt?: string;
  overallStatus: 'pending' | 'running' | 'passed' | 'failed';
  events: TraceEvent[];
}

/** Proposed diff from an agentic recovery, awaiting human approval before
 *  it gets merged back into the deterministic TestDefinition. */
export interface PromotionCandidate {
  promotionId: string;
  runId: string;
  testId: string;
  stepId: string;
  originalStep: TestStep;
  proposedStep: TestStep; // the agent's recovered version
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string;
}
