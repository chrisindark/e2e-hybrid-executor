import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { currentTenantId } from '../../database/tenant-context';
import { TenantTransactionService } from '../../database/tenant-transaction.service';
import { TestRunService } from '../test-run/test-run.service';
import { GeminiService } from '../utils/gemini/gemini.service';
import { OpenAIService } from '../utils/open-ai/open-ai.service';
import { RunOptions } from './execution.types';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly testRunService: TestRunService,
    private readonly openAIService: OpenAIService,
    private readonly geminiService: GeminiService,
    private readonly tenantTransactions: TenantTransactionService,
  ) {}

  async list() {
    return await this.testRunService.list();
  }

  async getRun(runId: string) {
    return await this.testRunService.getRun(runId);
  }

  async runTest(testId: string, options: RunOptions = {}) {
    const tenantId = currentTenantId();

    if (!tenantId) {
      throw new InternalServerErrorException(
        'No tenant in scope; cannot start a run',
      );
    }

    const runId = await this.testRunService.createQueuedRun(testId);

    // The run outlives the HTTP request, so it takes its own tenant-scoped
    // connection instead of borrowing the request's.
    void this.tenantTransactions
      .runWithTenant(tenantId, () =>
        this.testRunService.runTest(testId, options, runId),
      )
      .catch(async (error: Error) => {
        this.logger.error(
          `Run ${runId} failed in background: ${error.stack ?? error.message}`,
        );

        await this.tenantTransactions
          .runWithTenant(tenantId, () =>
            this.testRunService.failQueuedRun(
              runId,
              error.stack ?? error.message,
            ),
          )
          .catch((persistError: Error) => {
            this.logger.error(
              `Could not persist failure for run ${runId}: ${
                persistError.stack ?? persistError.message
              }`,
            );
          });
      });

    return { runId, status: 'QUEUED' };
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
