import { randomUUID } from 'node:crypto';

import * as moment from 'moment';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('step_attempts')
export class StepAttempt {
  @PrimaryColumn('uuid')
  attemptId: string = randomUUID();

  /** Set by the database from the session tenant; never provided by callers. */
  @Column({ type: 'uuid', insert: false, update: false })
  tenantId?: string;

  @Column('uuid')
  runId: string = '';

  @Column('uuid')
  stepId: string = '';

  @Column()
  attemptNumber: number = 0;

  @Column()
  status: 'pending' | 'running' | 'passed' | 'failed' = 'pending';

  @Column()
  startedAt: Date = moment.utc().toDate();

  @Column({ nullable: true })
  finishedAt?: Date;

  @Column('text', { nullable: true })
  error?: string;
}
