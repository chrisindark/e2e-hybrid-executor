// packages/types/src/index.ts

export type ActorType = 'user' | 'api_key' | 'system';
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface TenantContext {
  tenantId: string;
  actorId: string;
  actorType: ActorType
  correlationId: string;
  requestId: string;
  planTier: PlanTier;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  sub: string;
  type: ActorType;
  planTier: PlanTier;
}
