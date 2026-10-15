import { randomUUID } from 'node:crypto';

import * as moment from 'moment';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('test_definitions')
export class TestDefinition {
  @PrimaryColumn('uuid')
  testId: string = randomUUID();

  /** Set by the database from the session tenant; never provided by callers. */
  @Column({ type: 'uuid', insert: false, update: false })
  tenantId?: string;

  @Column()
  name: string = '';

  @Column('text')
  originalIntent: string = '';

  @Column()
  targetUrl: string = '';

  @Column('uuid', { nullable: true })
  currentVersionId?: string;

  @CreateDateColumn()
  createdAt: Date = moment.utc().toDate();

  @UpdateDateColumn()
  updatedAt: Date = moment.utc().toDate();
}
