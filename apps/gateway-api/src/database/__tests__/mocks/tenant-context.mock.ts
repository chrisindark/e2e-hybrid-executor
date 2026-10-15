import { createMock } from 'test/helpers/mock-factory';
import type { TenantScope } from '../../tenant-context';

export const mockTenantScope = () => createMock<TenantScope>();
