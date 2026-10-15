import { createMock } from 'test/helpers/mock-factory';
import type { OpenAIService } from '../../../utils/open-ai/open-ai.service';

export const mockOpenAIService = () => createMock<OpenAIService>();
