import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { defaultIfEmpty, from, lastValueFrom, Observable } from 'rxjs';

import { TenantTransactionService } from './tenant-transaction.service';

type AuthenticatedRequest = { user?: { tenantId?: string } };

/**
 * Opens one tenant-scoped connection for the duration of each authenticated
 * request, so every repository call the handler makes (and every method it
 * awaits) is evaluated by RLS under the caller's tenant.
 *
 * Guards run before interceptors, so `request.user` is already the verified JWT
 * claims here. Public routes carry no tenant and are passed straight through.
 */
@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  constructor(private readonly tenantTransactions: TenantTransactionService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = request.user?.tenantId;

    if (tenantId === undefined || tenantId === '') {
      return next.handle();
    }

    return from(
      this.tenantTransactions.runWithTenant(tenantId, () =>
        lastValueFrom(next.handle().pipe(defaultIfEmpty(undefined))),
      ),
    );
  }
}
