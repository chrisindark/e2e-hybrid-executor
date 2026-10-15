import { createMock } from 'test/helpers/mock-factory';
import type { TenantTransactionService } from '../../../../database/tenant-transaction.service';

export const mockTenantTransactionService = () =>
  createMock<TenantTransactionService>();
