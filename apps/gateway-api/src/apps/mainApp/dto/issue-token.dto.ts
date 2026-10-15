import type { ActorType, PlanTier } from '@repo/types';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import type { IssueTokenInput } from '../../../modules/auth/auth.types';

const ACTOR_TYPES: ActorType[] = ['user', 'api_key', 'system'];
const PLAN_TIERS: PlanTier[] = ['free', 'starter', 'pro', 'enterprise'];

/** Upper bound mirrors the guard's tolerance; one month is plenty for local dev. */
const MAX_TTL_SECONDS = 60 * 60 * 24 * 30;

export class IssueTokenDto implements IssueTokenInput {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  actorId?: string;

  @IsOptional()
  @IsIn(ACTOR_TYPES)
  actorType?: ActorType;

  @IsOptional()
  @IsIn(PLAN_TIERS)
  planTier?: PlanTier;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(MAX_TTL_SECONDS)
  expiresInSeconds?: number;
}
