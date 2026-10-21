/**
 * Domain types for the hybrid test-execution UI.
 *
 * These mirror the gateway's HTTP contract one-to-one. A few notes that are
 * easy to get wrong (verified against the gateway services):
 *  - `GET /v1/generation` returns test definitions with `steps` embedded,
 *    while `GET /v1/generation/:id` returns `{ testDefinition, testSteps }`.
 *  - `GET /v1/execution` returns runs with `events` embedded, while
 *    `GET /v1/execution/:runId` returns `{ run, traceEvents }`.
 *  - Promotion candidates carry `originalStep` / `proposedStep` as JSON
 *    **strings**, which must be parsed before use.
 */

export type ExecutionMode =
  'deterministic' | 'deterministic-with-fallback' | 'agentic-primary';

export type StepStatus =
  'pending' | 'running' | 'passed' | 'failed' | 'recovered';

export type RunStatus =
  'queued' | 'pending' | 'running' | 'passed' | 'failed' | 'recovered';

export type PromotionStatus = 'pending' | 'approved' | 'rejected';

export type TestAction =
  '' | 'goto' | 'click' | 'fill' | 'assertText' | 'assertVisible';

/** A single instruction inside a test: "do this, then expect that". */
export interface TestStep {
  stepId: string;
  order: number;
  description: string;
  action: TestAction;
  selector?: string | null;
  value?: string | null;
  expectedOutcome: string;
  testId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** A saved test: the plain-English intent plus its URL. */
export interface TestDefinition {
  testId: string;
  name: string;
  originalIntent: string;
  targetUrl: string;
  currentVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A test definition together with its ordered steps. */
export interface TestWithSteps extends TestDefinition {
  steps: TestStep[];
}

/** One recorded moment during a run: what was done and what happened. */
export interface TraceEvent {
  eventId: string;
  stepId: string;
  runId: string;
  mode: ExecutionMode;
  timestamp: string;
  status: StepStatus;
  durationMs?: number | null;
  actionTaken?: string | null;
  reasoning?: string | null;
  customerExplanation: string;
  error?: string | null;
}

/** A single execution of a test. */
export interface Run {
  runId: string;
  testId: string;
  versionId?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  error?: string | null;
  overallStatus: RunStatus;
}

/** A run together with its trace events. */
export interface RunWithEvents extends Run {
  events: TraceEvent[];
}

/** A proposed edit to a step, awaiting a human decision. */
export interface PromotionCandidate {
  promotionCandidateId: string;
  runId: string;
  testId: string;
  stepId: string;
  basedVersionId?: string | null;
  createdVersionId?: string | null;
  /** JSON-encoded TestStep. */
  originalStep: string;
  /** JSON-encoded TestStep. */
  proposedStep: string;
  reasoning: string;
  status: PromotionStatus;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string | null;
}

/** A promotion candidate with its step payloads already parsed. */
export interface DecidedPromotionCandidate extends Omit<
  PromotionCandidate,
  'originalStep' | 'proposedStep'
> {
  originalStep: TestStep;
  proposedStep: TestStep;
}

/** Output of `POST /v1/intent` — generated but not yet saved. */
export interface GeneratedTest {
  name: string;
  originalIntent: string;
  targetUrl: string;
  steps: TestStep[];
}

/** Raw response of `GET /v1/generation/:testId`. */
export interface TestStoreDetailResponse {
  testDefinition: TestDefinition | null;
  testSteps: TestStep[];
}

/** Raw response of `GET /v1/execution/:runId`. */
export interface ExecutionDetailResponse {
  run: Run | null;
  traceEvents: TraceEvent[];
}

/** Response of `POST /v1/execution/:testId/run`. */
export interface RunStartResponse {
  runId: string;
  status: RunStatus;
}

/** Response of `POST /v1/promotion-candidates/:id/decide`. */
export interface PromotionDecisionResponse {
  updateResponse: {
    affected?: number;
    generatedMaps?: unknown[];
    raw?: unknown[];
  };
  updatedTestStepResponse: unknown | null;
}

/** Shape of `GET /health/liveness` (NestJS Terminus). */
export interface LivenessResponse {
  status: string;
  info?: Record<string, unknown>;
  error?: Record<string, unknown>;
  details?: Record<string, unknown>;
}
