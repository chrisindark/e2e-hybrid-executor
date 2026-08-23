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

  @Column('uuid')
  runId: string = '';

  @Column('uuid')
  testId: string = '';

  @Column('uuid')
  stepId: string = '';

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
