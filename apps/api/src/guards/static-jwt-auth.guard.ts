import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class StaticJwtAuthGuard extends AuthGuard('jwt') {}
