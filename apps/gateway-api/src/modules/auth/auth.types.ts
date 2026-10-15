import type { ActorType, PlanTier } from '@repo/types';

/**
 * Transport-agnostic input for minting a token. The HTTP layer's
 * `IssueTokenDto` implements this contract, which keeps the domain free of
 * class-validator and of any dependency on the HTTP entry point.
 */
export interface IssueTokenInput {
  tenantId: string;
  actorId?: string;
  actorType?: ActorType;
  planTier?: PlanTier;
  expiresInSeconds?: number;
}
