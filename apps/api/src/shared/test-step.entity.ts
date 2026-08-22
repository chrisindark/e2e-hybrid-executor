import { randomUUID } from 'node:crypto';

import * as moment from 'moment';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TestAction } from './types';

@Entity('test_steps')
export class TestStep {
  @PrimaryColumn('uuid')
  stepId: string = randomUUID();

  @Column()
  order: number = 0;

  @Column('text')
  description: string = '';

  @Column({
    type: 'text',
  })
  action: TestAction = TestAction.None;

  @Column({ nullable: true })
  selector!: string;

  @Column('text', { nullable: true })
  value?: string;

  @Column('text')
  expectedOutcome: string = '';

  @Column('uuid')
  testId: string = '';

  @CreateDateColumn()
  createdAt: Date = moment.utc().toDate();

  @UpdateDateColumn()
  updatedAt: Date = moment.utc().toDate();
}
