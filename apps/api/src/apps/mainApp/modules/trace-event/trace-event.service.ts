import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';

import {
  ExecutionMode,
  StepStatus,
  TraceEvent,
} from '../../../../shared/trace-event.entity';

@Injectable()
export class TraceEventService {
  private readonly logger = new Logger(TraceEventService.name);

  constructor(
    @InjectRepository(TraceEvent)
    private readonly traceEventRepository: Repository<TraceEvent>,
  ) {}

  async createTraceEvent(params: {
    runId: string;
    stepId: string;
    mode: ExecutionMode;
    status: StepStatus;
    durationMs?: number;
    actionTaken?: string;
    reasoning?: string;
    customerExplanation: string;
    error?: string;
  }) {
    const traceEvent: TraceEvent = {
      eventId: randomUUID(),
      timestamp: moment.utc().toDate(),
      createdAt: moment.utc().toDate(),
      updatedAt: moment.utc().toDate(),
      ...params,
    };

    return await this.traceEventRepository.insert(traceEvent);
  }

  async getTraceEventsByRunId(runId: string) {
    return await this.traceEventRepository.findBy({
      runId: runId,
    });
  }

  async get(eventId: string) {
    return await this.traceEventRepository.findOneBy({ eventId: eventId });
  }

  async list() {
    return await this.traceEventRepository.find();
  }
}
