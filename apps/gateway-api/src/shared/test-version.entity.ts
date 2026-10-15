import { randomUUID } from 'node:crypto';

import * as moment from 'moment';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('test_versions')
export class TestVersion {
  @PrimaryColumn('uuid')
  versionId: string = randomUUID();

  /** Set by the database from the session tenant; never provided by callers. */
  @Column({ type: 'uuid', insert: false, update: false })
  tenantId?: string;

  @Column('uuid')
  testId: string = '';

  @Column('integer')
  versionNumber: number = 1;

  @Column('text')
  definitionSnapshot: string = '{}';

  @Column('text')
  stepsSnapshot: string = '[]';

  @Column('uuid', { nullable: true })
  parentVersionId?: string;

  @CreateDateColumn()
  createdAt: Date = moment.utc().toDate();
}
