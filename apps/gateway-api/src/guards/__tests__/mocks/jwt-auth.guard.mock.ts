import { createMock } from 'test/helpers/mock-factory';
import type { JwtAuthGuard } from '../../jwt-auth.guard';

export const mockJwtAuthGuard = () => createMock<JwtAuthGuard>();
