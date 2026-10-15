import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { RequestContext } from '@repo/telemetry';
import { ActorType, PlanTier } from '@repo/types';
import type { Request } from 'express';

import { JwtClaims, verifyJwt } from '../common/auth/jwt.util';
import { IS_PUBLIC_KEY } from './public.decorator';

type AuthenticatedRequest = Request & { user?: JwtClaims };

const ACTOR_TYPES = ['user', 'api_key', 'system'] as const;
const PLAN_TIERS = ['free', 'starter', 'pro', 'enterprise'] as const;

function isActorType(value: unknown): value is ActorType {
  return (
    typeof value === 'string' &&
    (ACTOR_TYPES as readonly string[]).includes(value)
  );
}

function isPlanTier(value: unknown): value is PlanTier {
  return (
    typeof value === 'string' &&
    (PLAN_TIERS as readonly string[]).includes(value)
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization ?? '';
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
    const claims = this.verify(token);
    request.user = claims;
    this.applyTenantContext(claims);

    return true;
  }

  /**
   * Publishes the verified claims to the request-scoped `RequestContext`
   * (from `@repo/telemetry`). The context is established by
   * `CorrelationIdMiddleware` for every request; a guard cannot create it,
   * only populate it.
   */
  private applyTenantContext(claims: JwtClaims): void {
    const tenantContext = RequestContext.getOptional();

    if (!tenantContext) {
      this.logger.warn(
        'RequestContext was not established for this request; skipping tenant context',
        JwtAuthGuard.name,
      );

      return;
    }

    tenantContext.tenantId = claims.tenantId ?? 'anonymous';
    tenantContext.actorId = claims.sub ?? 'anonymous';

    if (isActorType(claims.type)) tenantContext.actorType = claims.type;

    if (isPlanTier(claims.planTier)) tenantContext.planTier = claims.planTier;
  }

  private verify(token: string): JwtClaims {
    const secret = this.configService.get<string>('JWT_SECRET') ?? '';

    if (!secret || !token) throw new UnauthorizedException();

    try {
      const claims = verifyJwt(token, secret);

      if (
        claims.tenantId === null ||
        claims.tenantId === undefined ||
        claims.tenantId === '' ||
        typeof claims.tenantId !== 'string'
      ) {
        throw new UnauthorizedException();
      }

      return claims;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException();
    }
  }
}
