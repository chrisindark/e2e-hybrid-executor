import { createMock } from 'test/helpers/mock-factory';
import type { OpenAIService } from '../../open-ai.service';

export const mockOpenAIService = () => createMock<OpenAIService>();
