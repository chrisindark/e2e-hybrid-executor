import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { JwtClaims } from '../../../../common/auth/jwt.util';
import { Public } from '../../../../guards/public.decorator';
import { AuthService } from './auth.service';
import { IssueTokenDto } from './dto/issue-token.dto';

type AuthenticatedRequest = Request & { user?: JwtClaims };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Development/bootstrap endpoint: mints a tenant-scoped JWT the global
   * `JwtAuthGuard` accepts. Replace with a real identity provider before
   * exposing this in production.
   */
  @Public()
  @Post('token')
  issueToken(@Body() dto: IssueTokenDto) {
    return this.authService.issueToken(dto);
  }

  /** Echoes the validated claims; handy for confirming a token works. */
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return { claims: request.user };
  }
}
