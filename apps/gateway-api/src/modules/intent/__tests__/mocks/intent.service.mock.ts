import { createMock } from 'test/helpers/mock-factory';
import type { IntentService } from '../../intent.service';

export const mockIntentService = () => createMock<IntentService>();
