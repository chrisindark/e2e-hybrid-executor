import { createMock } from 'test/helpers/mock-factory';
import type { StaticJwtAuthGuard } from '../../static-jwt-auth.guard';

export const mockStaticJwtAuthGuard = () => createMock<StaticJwtAuthGuard>();
