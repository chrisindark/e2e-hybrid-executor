import { createMock } from 'test/helpers/mock-factory';
import type { AuthService } from '../../../../../modules/auth/auth.service';

export const mockAuthService = () => createMock<AuthService>();
