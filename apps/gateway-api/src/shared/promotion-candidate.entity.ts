import { randomUUID } from 'node:crypto';

import * as moment from 'moment';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum PromotionCandidateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('promotion_candidates')
export class PromotionCandidate {
  @PrimaryColumn('uuid')
  promotionCandidateId: string = randomUUID();

  /** Set by the database from the session tenant; never provided by callers. */
  @Column({ type: 'uuid', insert: false, update: false })
  tenantId?: string;

  @Column('uuid')
  runId: string = '';

  @Column('uuid')
  testId: string = '';

  @Column('uuid')
  stepId: string = '';

  @Column('uuid', { nullable: true })
  basedVersionId?: string;

  @Column('uuid', { nullable: true })
  createdVersionId?: string;

  @Column('text')
  originalStep: string = '';

  @Column('text')
  proposedStep: string = '';

  @Column()
  reasoning: string = '';

  @Column()
  status: PromotionCandidateStatus = PromotionCandidateStatus.PENDING;

  @Column()
  createdAt: Date = moment.utc().toDate();

  @Column()
  updatedAt: Date = moment.utc().toDate();

  @Column({ nullable: true })
  decidedAt?: Date;
}
