import { createMock } from 'test/helpers/mock-factory';
import type { GenerationService } from '../../../../../modules/e2e-tests/e2e-tests.service';

export const mockGenerationService = () => createMock<GenerationService>();
