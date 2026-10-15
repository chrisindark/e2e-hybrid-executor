import { createMock } from 'test/helpers/mock-factory';
import type { IntentService } from '../../../../../modules/intent/intent.service';

export const mockIntentService = () => createMock<IntentService>();
