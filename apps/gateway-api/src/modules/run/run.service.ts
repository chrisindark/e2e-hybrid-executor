import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';

import { Run, RunStatus } from '../../shared/run.entity';

@Injectable()
export class RunService {
  constructor(
    @InjectRepository(Run)
    private readonly runRepository: Repository<Run>,
  ) {}

  async createRun(testId: string, versionId?: string) {
    const run: Run = {
      runId: randomUUID(),
      testId,
      versionId,
      startedAt: moment.utc().toDate(),
      overallStatus: RunStatus.PENDING,
      createdAt: moment.utc().toDate(),
      updatedAt: moment.utc().toDate(),
    };

    return await this.runRepository.insert(run);
  }

  async get(runId: string) {
    return await this.runRepository.findOneBy({ runId: runId });
  }

  async list() {
    return await this.runRepository.find();
  }

  async updateOverallStatusByRunId(runId: string, status: RunStatus) {
    return await this.runRepository.update(
      { runId: runId },
      {
        overallStatus: status,
      },
    );
  }

  async failRun(runId: string, error: string) {
    return this.runRepository.update(
      { runId },
      {
        overallStatus: RunStatus.FAILED,
        finishedAt: moment.utc().toDate(),
        error,
      },
    );
  }

  async updateOverallStatusAndFinishedAtByRunId(
    runId: string,
    status: RunStatus,
    finishedAt: Date,
    error?: string,
  ) {
    return await this.runRepository.update(
      {
        runId: runId,
      },
      {
        overallStatus: status,
        finishedAt: finishedAt,
        ...(error ? { error } : {}),
      },
    );
  }
}
