import { createMock } from 'test/helpers/mock-factory';
import type { BasicAuthGuard } from '../../basic-auth.guard';

export const mockBasicAuthGuard = () => createMock<BasicAuthGuard>();
