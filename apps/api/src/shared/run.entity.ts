import { randomUUID } from 'crypto';
import * as moment from 'moment';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
}

@Entity('runs')
export class Run {
  @PrimaryColumn('uuid')
  runId: string = randomUUID();

  @Column('uuid')
  testId: string = '';

  @Column()
  startedAt: Date = moment.utc().toDate();

  @Column({ nullable: true })
  finishedAt?: Date = moment.utc().toDate();

  @Column({
    type: 'text',
  })
  overallStatus: RunStatus = RunStatus.PENDING;

  @CreateDateColumn()
  createdAt: Date = moment.utc().toDate();

  @UpdateDateColumn()
  updatedAt: Date = moment.utc().toDate();
}
