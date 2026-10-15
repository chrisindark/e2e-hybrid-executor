import { createMock } from 'test/helpers/mock-factory';
import type { GeminiService } from '../../gemini.service';

export const mockGeminiService = () => createMock<GeminiService>();
