import { randomUUID } from 'node:crypto';

import * as moment from 'moment';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExecutionMode {
  DETERMINISTIC = 'deterministic',
  DETERMINISTIC_WITH_FALLBACK = 'deterministic-with-fallback',
  AGENTIC_PRIMARY = 'agentic-primary',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  RECOVERED = 'recovered',
}

@Entity('trace_events')
export class TraceEvent {
  @PrimaryColumn('uuid')
  eventId: string = randomUUID();

  @Column('uuid')
  stepId: string = '';

  @Column('uuid')
  runId: string = '';

  @Column()
  mode: ExecutionMode = ExecutionMode.DETERMINISTIC;

  @Column()
  timestamp: Date = moment.utc().toDate();

  @Column({
    type: 'text',
  })
  status: StepStatus = StepStatus.PENDING;

  @Column({ type: 'integer', nullable: true })
  durationMs?: number;

  @Column('text', { nullable: true })
  actionTaken?: string;

  @Column('text', { nullable: true })
  reasoning?: string;

  @Column('text')
  customerExplanation: string = '';

  @Column('text', { nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date = moment.utc().toDate();

  @UpdateDateColumn()
  updatedAt: Date = moment.utc().toDate();
}
