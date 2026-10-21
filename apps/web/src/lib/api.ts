/**
 * Thin, typed client for the gateway API.
 *
 * The gateway is versioned by URI, so most endpoints live under `/v1`. Health
 * probes are version-neutral (`/health/...`). Every request is authenticated
 * with a short-lived tenant-scoped token minted by `POST /v1/auth/token`.
 */

import { parseStepPayload } from './format';
import type {
  DecidedPromotionCandidate,
  ExecutionDetailResponse,
  GeneratedTest,
  LivenessResponse,
  PromotionCandidate,
  PromotionDecisionResponse,
  Run,
  RunStartResponse,
  RunWithEvents,
  TestStep,
  TestStoreDetailResponse,
  TestWithSteps,
  TraceEvent,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? 'tenant-demo';
const ACTOR_ID = process.env.NEXT_PUBLIC_ACTOR_ID ?? 'demo-user';

export const apiConfig = {
  baseUrl: API_BASE,
  tenantId: TENANT_ID,
  actorId: ACTOR_ID,
};

/** Cached bootstrap token so we only hit /v1/auth/token when needed. */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function fetchToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: TENANT_ID, actorId: ACTOR_ID }),
  });

  if (!res.ok) {
    throw new Error(
      `Could not authenticate with the API (${res.status}): ${await res.text()}`,
    );
  }

  const data = (await res.json()) as { accessToken: string; expiresIn: number };

  // Refresh 30s early to avoid racing the server-side expiry check.
  cachedToken = {
    value: data.accessToken,
    expiresAt: Date.now() + Math.max(0, data.expiresIn - 30) * 1000,
  };

  return data.accessToken;
}

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  return fetchToken();
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  // 204 / empty bodies are valid for some endpoints.
  const text = await res.text();

  return (text ? JSON.parse(text) : null) as T;
}

/** Parse a promotion candidate's JSON-encoded steps, tolerating bad payloads. */
export function parsePromotionCandidate(
  candidate: PromotionCandidate,
): DecidedPromotionCandidate {
  return {
    ...candidate,
    originalStep:
      parseStepPayload(candidate.originalStep) ?? emptyStep(candidate.stepId),
    proposedStep:
      parseStepPayload(candidate.proposedStep) ?? emptyStep(candidate.stepId),
  };
}

function emptyStep(stepId: string): TestStep {
  return {
    stepId,
    order: 0,
    description: 'Unreadable step payload',
    action: '',
    expectedOutcome: '',
  };
}

/** Does a run still need polling? */
export function isRunInFlight(run: Pick<Run, 'overallStatus'>) {
  return (
    run.overallStatus === 'queued' ||
    run.overallStatus === 'pending' ||
    run.overallStatus === 'running'
  );
}

export const api = {
  config: apiConfig,

  /** Public liveness probe used by the connection banner. */
  getLiveness: async () => {
    const res = await fetch(`${API_BASE}/health/liveness`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);

    return (await res.json()) as LivenessResponse;
  },

  // ---------------------------------------------------------------- intent
  /** Ask the AI to turn a sentence into steps. Nothing is saved yet. */
  generateFromIntent: (intent: string, targetUrl: string) =>
    request<GeneratedTest>('/v1/intent', {
      method: 'POST',
      body: JSON.stringify({ intent, targetUrl }),
    }),

  // ------------------------------------------------------------ generation
  /** Persist a generated test. Returns it in the detail shape. */
  saveGeneratedTest: async (test: GeneratedTest): Promise<TestWithSteps> => {
    const response = await request<TestStoreDetailResponse>('/v1/generation', {
      method: 'POST',
      body: JSON.stringify(test),
    });

    return toTestWithSteps(response);
  },

  /** Generate and save in one step. */
  createTestFromIntent: async (intent: string, targetUrl: string) => {
    const generated = await api.generateFromIntent(intent, targetUrl);

    return api.saveGeneratedTest(generated);
  },

  /** All saved tests, each with its ordered steps. */
  listTests: () =>
    request<TestWithSteps[]>('/v1/generation').then((tests) =>
      tests.map((test) => ({ ...test, steps: test.steps ?? [] })),
    ),

  /** One saved test, with steps. Returns null when the id does not exist. */
  getTest: async (testId: string): Promise<TestWithSteps | null> => {
    const response = await request<TestStoreDetailResponse>(
      `/v1/generation/${encodeURIComponent(testId)}`,
    );

    return response.testDefinition ? toTestWithSteps(response) : null;
  },

  updateTest: async (testId: string, patch: Partial<GeneratedTest>) => {
    const response = await request<TestStoreDetailResponse>(
      `/v1/generation/${encodeURIComponent(testId)}`,
      { method: 'PUT', body: JSON.stringify(patch) },
    );

    return toTestWithSteps(response);
  },

  // ------------------------------------------------------------- execution
  /** Runs with their trace events embedded. */
  listRuns: () => request<RunWithEvents[]>('/v1/execution'),

  /** One run plus all of its trace events. */
  getRunWithEvents: async (runId: string) => {
    const response = await request<ExecutionDetailResponse>(
      `/v1/execution/${encodeURIComponent(runId)}`,
    );

    return {
      run: response.run,
      events: response.traceEvents ?? [],
    };
  },

  /** The raw run row (no events); 404s when missing. */
  getRun: (runId: string) =>
    request<Run>(`/v1/runs/${encodeURIComponent(runId)}`),

  /** Start a run. Returns immediately with 202 + the new run id. */
  startRun: (
    testId: string,
    options?: { mode?: string; forceFailureAtStep?: number },
  ) =>
    request<RunStartResponse>(
      `/v1/execution/${encodeURIComponent(testId)}/run`,
      {
        method: 'POST',
        body: JSON.stringify({
          mode: options?.mode,
          forceFailureAtStep: options?.forceFailureAtStep,
        }),
      },
    ),

  // ----------------------------------------------------------- promotions
  listPromotions: () =>
    request<PromotionCandidate[]>('/v1/promotion-candidates').then(
      (candidates) => candidates.map(parsePromotionCandidate),
    ),

  getPromotion: async (promotionCandidateId: string) => {
    const candidate = await request<PromotionCandidate | null>(
      `/v1/promotion-candidates/${encodeURIComponent(promotionCandidateId)}`,
    );

    return candidate ? parsePromotionCandidate(candidate) : null;
  },

  decidePromotion: (promotionCandidateId: string, approve: boolean) =>
    request<PromotionDecisionResponse>(
      `/v1/promotion-candidates/${encodeURIComponent(promotionCandidateId)}/decide`,
      { method: 'POST', body: JSON.stringify({ approve }) },
    ),
};

function toTestWithSteps(response: TestStoreDetailResponse): TestWithSteps {
  const definition = response.testDefinition;

  if (!definition) {
    throw new Error('The API returned no test definition');
  }

  return { ...definition, steps: sortSteps(response.testSteps ?? []) };
}

export function sortSteps(steps: TestStep[]) {
  return [...steps].sort((a, b) => a.order - b.order);
}

/** Sort newest-first, which is what every list view wants. */
export function sortByStartedDesc<T extends { startedAt?: string | null }>(
  runs: T[],
) {
  return [...runs].sort(
    (a, b) =>
      new Date(b.startedAt ?? 0).getTime() -
      new Date(a.startedAt ?? 0).getTime(),
  );
}

export function sortEventsAscending(events: TraceEvent[]) {
  return [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

export type {
  Run,
  RunWithEvents,
  TraceEvent,
  TestWithSteps,
  DecidedPromotionCandidate,
};
