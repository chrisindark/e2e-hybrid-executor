import { createMock } from 'test/helpers/mock-factory';
import type { GenerationService } from '../../e2e-tests.service';

export const mockGenerationService = () => createMock<GenerationService>();
