import { Injectable, Logger } from '@nestjs/common';

import { TestRunService } from '../test-run/test-run.service';
import { GeminiService } from '../utils/gemini/gemini.service';
import { OpenAIService } from '../utils/open-ai/open-ai.service';
import { RunOptions } from './execution.dto';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly testRunService: TestRunService,
    private readonly openAIService: OpenAIService,
    private readonly geminiService: GeminiService,
  ) {}

  async list() {
    return await this.testRunService.list();
  }

  async getRun(runId: string) {
    return await this.testRunService.getRun(runId);
  }

  async runTest(testId: string, options: RunOptions = {}) {
    return await this.testRunService.runTest(testId, options);
  }

  async getOpenAICompletion(content: string, schema: any = null) {
    const model = 'openai/gpt-oss-20b';
    const completion = await this.openAIService.normalCompletion(
      content,
      '',
      model,
      schema,
    );

    return completion;
  }

  async getGeminiCompletion(content: string, schema: any = null) {
    const model = 'gemini-3.5-flash-lite';
    const completion = await this.geminiService.normalCompletion(
      content,
      '',
      model,
      schema,
    );

    return completion;
  }

  async reRunTest(testId: string, order: number) {
    const response = await this.testRunService.reRunTillStep(testId, order);

    return response;
  }
}
