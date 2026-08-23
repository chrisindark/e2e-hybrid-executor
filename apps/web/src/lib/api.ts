const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface TestStep {
  stepId: string;
  order: number;
  description: string;
  action: string;
  selector?: string;
  value?: string;
  expectedOutcome: string;
}

export interface TestDefinition {
  testId: string;
  name: string;
  originalIntent: string;
  targetUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedTest {
  name: string;
  originalIntent: string;
  targetUrl: string;
  steps: TestStep[];
}

export interface TestStore extends TestDefinition {
  steps: TestStep[];
}

export interface TestStoreResponse {
  testDefinition: TestDefinition;
  testSteps: TestStep[];
}

export interface GenerationCreateResponse {
  testId?: string;
  identifiers?: Array<{ testId?: string }>;
}

export interface TraceEvent {
  eventId: string;
  stepId: string;
  runId: string;
  mode: string;
  timestamp: string;
  status: string;
  durationMs?: number;
  actionTaken?: string;
  reasoning?: string;
  customerExplanation: string;
  error?: string;
}

export interface Run {
  runId: string;
  testId: string;
  startedAt: string;
  finishedAt?: string;
  overallStatus: string;
}

export interface TestRun extends Run {
  events: TraceEvent[];
}

export interface RunCreateResponse {
  run?: { identifiers?: Array<{ runId?: string }> };
  runId?: string;
}

export interface ExecutionResponse {
  run: Run;
  traceEvents: TraceEvent[];
}

export interface PromotionCandidate {
  promotionCandidateId: string;
  runId: string;
  testId: string;
  stepId: string;
  originalStep: string;
  proposedStep: string;
  reasoning: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  generateTestFromIntent: (intent: string, targetUrl: string) =>
    request<GeneratedTest>('/v1/intent', {
      method: 'POST',
      body: JSON.stringify({ intent, targetUrl }),
    }),

  saveGeneratedTest: (test: GeneratedTest) =>
    request<GenerationCreateResponse>('/v1/generation', {
      method: 'POST',
      body: JSON.stringify(test),
    }),

  createTestFromIntent: async (intent: string, targetUrl: string) => {
    const generatedTest = await api.generateTestFromIntent(intent, targetUrl);
    const savedTest = await api.saveGeneratedTest(generatedTest);
    const testId = savedTest.testId ?? savedTest.identifiers?.[0]?.testId;

    if (!testId) {
      throw new Error('The generation API did not return a test ID');
    }

    return api.getTest(testId);
  },

  getTest: async (testId: string) => {
    const response = await request<TestStoreResponse>(`/v1/generation/${testId}`);

    return {
      ...response.testDefinition,
      steps: response.testSteps,
    };
  },

  listTests: () => request<TestStore[]>('/v1/generation'),

  runTest: (testId: string, forceFailureAtStep?: number) =>
    request<RunCreateResponse>(`/v1/execution/${testId}/run`, {
      method: 'POST',
      body: JSON.stringify({ forceFailureAtStep }),
    }),

  listExecutions: () => request<TestRun[]>('/v1/execution'),

  getRun: (runId: string) => request<Run>(`/v1/runs/${runId}`),

  getExecution: async (runId: string) => {
    const response = await request<ExecutionResponse>(`/v1/execution/${runId}`);

    return {
      ...response.run,
      events: response.traceEvents,
    };
  },

  listPromotionCandidates: () => request<PromotionCandidate[]>('/v1/promotion-candidates'),

  getPromotionCandidate: (promotionCandidateId: string) => request<PromotionCandidate>(`/v1/promotion-candidates/${promotionCandidateId}`),

  decidePromotionCandidate: (promotionCandidateId: string, approve: boolean) =>
    request<PromotionCandidate>(`/v1/promotion-candidates/${promotionCandidateId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ approve }),
    }),
};
