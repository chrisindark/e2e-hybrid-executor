import { randomUUID } from 'node:crypto';

import * as moment from 'moment';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A tenant (organisation). The root of the isolation model: every other table
 * carries a `tenantId` foreign key back here, and RLS policies compare that
 * column against the session's `app.tenant_id`.
 *
 * `tenants` is deliberately *not* protected by RLS — it is the table the
 * policies resolve against, and reads of it are needed to describe a tenant.
 */
@Entity('tenants')
export class Tenant {
  @PrimaryColumn('uuid')
  tenantId: string = randomUUID();

  @Column({ length: 64, unique: true })
  slug: string = '';

  @Column()
  name: string = '';

  @Column({ length: 32 })
  planTier: string = 'free';

  @Column('integer')
  maxConcurrentRuns: number = 2;

  @Column('integer')
  monthlyRunQuota: number = 500;

  @CreateDateColumn()
  createdAt: Date = moment.utc().toDate();

  @UpdateDateColumn()
  updatedAt: Date = moment.utc().toDate();
}
