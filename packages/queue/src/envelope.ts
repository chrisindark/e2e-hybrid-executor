import { RequestContext } from '@repo/telemetry';

export interface JobEnvelope<T> {
  payload: T;
  meta: {
    tenantId: string;
    actorId: string;
    correlationId: string;
    requestId: string;
    enqueuedAt: string;
    priority: number;
    planTier: 'free' | 'starter' | 'pro' | 'enterprise';
  };
}

export function wrapJob<T>(payload: T, priority = 0): JobEnvelope<T> {
  const ctx = RequestContext.get();
  return {
    payload,
    meta: {
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      correlationId: ctx.correlationId,
      requestId: ctx.requestId,
      enqueuedAt: new Date().toISOString(),
      priority,
      planTier: ctx.planTier,
    },
  };
}
