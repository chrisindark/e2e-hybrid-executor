import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActorType, PlanTier } from '@repo/types';

import { signJwt } from '../../../../common/auth/jwt.util';
import { IssueTokenDto } from './dto/issue-token.dto';

/** Bootstrapping tokens for a tenant/actor pair, signed with the shared secret. */
const DEFAULT_TTL_SECONDS = 60 * 60 * 12;

export interface IssuedToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  claims: {
    tenantId: string;
    sub: string;
    type: ActorType;
    planTier: PlanTier;
  };
}

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  issueToken(dto: IssueTokenDto): IssuedToken {
    const secret = this.configService.get<string>('JWT_SECRET') ?? '';

    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_SECRET is not configured; cannot issue tokens',
      );
    }

    const expiresIn = dto.expiresInSeconds ?? DEFAULT_TTL_SECONDS;
    const claims: IssuedToken['claims'] = {
      tenantId: dto.tenantId,
      sub: dto.actorId ?? dto.tenantId,
      type: dto.actorType ?? 'user',
      planTier: dto.planTier ?? 'free',
    };

    return {
      accessToken: signJwt(claims, secret, { expiresInSeconds: expiresIn }),
      tokenType: 'Bearer',
      expiresIn,
      claims,
    };
  }
}
