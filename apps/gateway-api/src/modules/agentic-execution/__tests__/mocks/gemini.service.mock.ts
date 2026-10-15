import { createMock } from 'test/helpers/mock-factory';
import type { GeminiService } from '../../../utils/gemini/gemini.service';

export const mockGeminiService = () => createMock<GeminiService>();
