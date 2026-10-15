import { createMock } from 'test/helpers/mock-factory';
import type { TenantScopeInterceptor } from '../../tenant-scope.interceptor';

export const mockTenantScopeInterceptor = () =>
  createMock<TenantScopeInterceptor>();
