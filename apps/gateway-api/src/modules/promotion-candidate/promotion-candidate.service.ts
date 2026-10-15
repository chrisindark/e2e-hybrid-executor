import { randomUUID } from 'node:crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';

import {
  PromotionCandidate,
  PromotionCandidateStatus,
} from '../../shared/promotion-candidate.entity';
import { TestStep } from '../../shared/test-step.entity';
import { TestStoreService } from '../test-store/test-store.service';
import type { CreatePromotionCandidateInput } from './promotion-candidate.types';

/**
 * Owns the promotion lifecycle: agentic recovery -> candidate -> human
 * review -> (if approved) deterministic script update. This is the
 * "agentic learning loop" the assignment asks for made explicit and
 * inspectable, rather than an automatic, opaque self-healing step.
 */
@Injectable()
export class PromotionCandidateService {
  private readonly logger = new Logger(PromotionCandidateService.name);

  constructor(
    @InjectRepository(PromotionCandidate)
    private readonly promotionCandidateRepository: Repository<PromotionCandidate>,
    private readonly testStoreService: TestStoreService,
  ) {}

  get(promotionCandidateId: string) {
    return this.promotionCandidateRepository.findOneBy({
      promotionCandidateId,
    });
  }

  async createCandidate(data: CreatePromotionCandidateInput) {
    const promotionCandidate = new PromotionCandidate();
    promotionCandidate.promotionCandidateId = randomUUID();
    promotionCandidate.runId = data.runId;
    promotionCandidate.testId = data.testId;
    promotionCandidate.stepId = data.stepId;
    promotionCandidate.basedVersionId = data.basedVersionId;
    promotionCandidate.originalStep = JSON.stringify(data.originalStep);
    promotionCandidate.proposedStep = JSON.stringify(data.proposedStep);
    promotionCandidate.reasoning = data.reasoning;
    promotionCandidate.createdAt = moment.utc().toDate();
    promotionCandidate.updatedAt = moment.utc().toDate();

    return await this.promotionCandidateRepository.insert(promotionCandidate);
  }

  async list() {
    return await this.promotionCandidateRepository.find();
  }

  async update(
    promotionCandidateId: string,
    data: Partial<PromotionCandidate>,
  ) {
    return await this.promotionCandidateRepository.update(
      promotionCandidateId,
      data,
    );
  }

  async decide(promotionId: string, approve: boolean) {
    const promotionCandidate = await this.get(promotionId);

    if (!promotionCandidate) {
      throw new NotFoundException(
        `PromotionCandidate ${promotionId} not found`,
      );
    }

    const updatedPromotionCandidate = {} as PromotionCandidate;

    if (approve) {
      updatedPromotionCandidate.status = PromotionCandidateStatus.APPROVED;
    } else {
      updatedPromotionCandidate.status = PromotionCandidateStatus.REJECTED;
    }
    updatedPromotionCandidate.decidedAt = moment.utc().toDate();

    let updatedTestStepResponse = null;

    if (approve) {
      const stepId = promotionCandidate.stepId;
      const proposedStep = promotionCandidate.proposedStep;
      const parsedProposedStep: TestStep = JSON.parse(proposedStep);
      updatedTestStepResponse = await this.testStoreService.promoteProposedStep(
        promotionCandidate.testId,
        stepId,
        parsedProposedStep,
        promotionCandidate.basedVersionId,
      );
      promotionCandidate.createdVersionId = updatedTestStepResponse.versionId;
    }

    const updateResponse = await this.promotionCandidateRepository.update(
      promotionCandidate.promotionCandidateId,
      {
        ...updatedPromotionCandidate,
        createdVersionId: promotionCandidate.createdVersionId,
      },
    );
    this.logger.debug(
      `Updated PromotionCandidate ${promotionCandidate.promotionCandidateId}:`,
      updateResponse,
    );

    return { updateResponse, updatedTestStepResponse };
  }
}
