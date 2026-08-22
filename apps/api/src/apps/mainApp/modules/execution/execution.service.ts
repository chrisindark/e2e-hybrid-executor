import { Injectable, Logger } from '@nestjs/common';

import { TestRunService } from '../test-run/test-run.service';
import { OpenAIService } from '../utils/open-ai/open-ai.service';
import { RunOptions } from './execution.dto';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly testRunService: TestRunService,
    private readonly openAIService: OpenAIService,
  ) {}

  async getRun(runId: string) {
    return await this.testRunService.getRun(runId);
  }

  async runTest(testId: string, options: RunOptions = {}) {
    return await this.testRunService.runTest(testId, options);
  }

  async getCompletion(content: string) {
    const model = 'openai/gpt-oss-20b';
    const completion = await this.openAIService.normalCompletion(
      content,
      '',
      model,
    );

    return completion;
  }

  async reRunTest(testId: string, order: number) {
    const response = await this.testRunService.reRunTillStep(testId, order);

    return response;
  }
}
