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

  @Column()
  name: string = '';

  @Column('text')
  originalIntent: string = '';

  @Column()
  targetUrl: string = '';

  @CreateDateColumn()
  createdAt: Date = moment.utc().toDate();

  @UpdateDateColumn()
  updatedAt: Date = moment.utc().toDate();
}
