import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as moment from 'moment';

import { TestDefinition } from '../../../../shared/test-definition.entity';
import { TestStep } from '../../../../shared/test-step.entity';
import { TestAction } from '../../../../shared/types';
import { TestStoreService } from '../test-store/test-store.service';
import {
  CreateE2eTestDto,
  CreateE2eTestStepDto,
} from './dto/create-e2e-test.dto';
import { UpdateE2eTestDto } from './dto/update-e2e-test.dto';

export const ALLOWED_ACTIONS = new Set([
  'goto',
  'click',
  'fill',
  'assertText',
  'assertVisible',
]);

@Injectable()
export class E2eTestsService {
  constructor(private readonly testStoreService: TestStoreService) {}

  async create(dto: CreateE2eTestDto) {
    const now = moment.utc().toDate();
    const id = randomUUID();
    const testDefinition: TestDefinition = {
      testId: id,
      name: dto.name.trim(),
      originalIntent: dto.originalIntent.trim(),
      targetUrl: dto.targetUrl.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const testSteps = this.createSteps(id, dto.steps);

    return await this.testStoreService.save(testDefinition, testSteps);
  }

  async list() {
    return await this.testStoreService.list();
  }

  async get(testId: string) {
    return await this.testStoreService.get(testId);
  }

  async update(testId: string, dto: UpdateE2eTestDto) {
    const hasDefinition = dto.testDefinition !== undefined;
    const hasSteps = dto.steps !== undefined;
    const hasStep = dto.step !== undefined;

    if (!hasDefinition && !hasSteps && !hasStep) {
      throw new BadRequestException(
        'At least one of testDefinition, steps, or step must be provided',
      );
    }

    if (hasDefinition && Object.keys(dto.testDefinition!).length === 0) {
      throw new BadRequestException(
        'testDefinition must contain at least one field',
      );
    }

    if (hasSteps && hasStep) {
      throw new BadRequestException(
        'Provide either steps for full replacement or step for a single-step update',
      );
    }

    const testStore = await this.testStoreService.get(testId);

    if (!testStore.testDefinition) {
      throw new NotFoundException();
    }

    const definitionPatch = hasDefinition
      ? this.createDefinitionPatch(dto.testDefinition!)
      : {};
    const replacementSteps = hasSteps
      ? this.createSteps(testId, dto.steps ?? [])
      : [];

    return this.testStoreService.update(
      testId,
      definitionPatch,
      replacementSteps,
    );
  }

  remove(testId: string) {}

  private createSteps(
    id: string,
    steps: CreateE2eTestStepDto[],
  ): Partial<TestStep>[] {
    const createdSteps = steps
      .map((s, index) => ({
        testId: id,
        stepId: randomUUID(),
        order: s.order ?? index + 1,
        description: s.description.trim(),
        action: s.action,
        selector: s.selector,
        value: s.value,
        expectedOutcome: s.expectedOutcome.trim(),
        createdAt: moment.utc().toDate(),
        updatedAt: moment.utc().toDate(),
      }))
      .sort((a, b) => a.order - b.order);

    if (
      new Set(createdSteps.map((step) => step.order)).size !==
      createdSteps.length
    ) {
      throw new BadRequestException(
        'steps must not contain duplicate order values',
      );
    }

    createdSteps.forEach((step) => this.validateStep(step));

    return createdSteps;
  }

  private createDefinitionPatch(
    definition: NonNullable<UpdateE2eTestDto['testDefinition']>,
  ): Partial<TestDefinition> {
    return {
      ...(definition.name === undefined
        ? {}
        : { name: definition.name.trim() }),
      ...(definition.originalIntent === undefined
        ? {}
        : { originalIntent: definition.originalIntent.trim() }),
      ...(definition.targetUrl === undefined
        ? {}
        : { targetUrl: definition.targetUrl.trim() }),
    };
  }

  private validateStep(step: Partial<TestStep>): void {
    if (step.action != null && !ALLOWED_ACTIONS.has(step.action)) {
      throw new BadRequestException(
        `action must be one of: ${[...ALLOWED_ACTIONS].join(', ')}`,
      );
    }

    if (
      step.description != null &&
      step.expectedOutcome != null &&
      (!step.description?.trim() || !step.expectedOutcome?.trim())
    ) {
      throw new BadRequestException(
        'description and expectedOutcome are required for every step',
      );
    }

    if (
      [
        TestAction.Click,
        TestAction.Fill,
        TestAction.AssertText,
        TestAction.AssertVisible,
      ].includes(step.action as TestAction) &&
      (step.selector === undefined || step.selector.trim().length === 0)
    ) {
      throw new BadRequestException(
        `selector is required for action "${step.action}"`,
      );
    }

    if (
      (step.action === TestAction.Goto || step.action === TestAction.Fill) &&
      step.value === undefined
    ) {
      throw new BadRequestException(
        `value is required for action "${step.action}"`,
      );
    }
  }

  // private validatePayload(
  //   name: string,
  //   targetUrl: string,
  //   steps: Array<Pick<CreateE2eTestStepDto, 'action' | 'description' | 'expectedOutcome' | 'selector' | 'value'>>,
  // ) {
  //   if (!name?.trim()) {
  //     throw new BadRequestException('name is required');
  //   }
  //   if (!targetUrl?.trim()) {
  //     throw new BadRequestException('targetUrl is required');
  //   }
  //   if (!Array.isArray(steps) || steps.length === 0) {
  //     throw new BadRequestException('steps must be a non-empty array');
  //   }

  //   for (const [i, step] of steps.entries()) {
  //     if (!step.description?.trim()) {
  //       throw new BadRequestException(`steps[${i}].description is required`);
  //     }
  //     if (!step.expectedOutcome?.trim()) {
  //       throw new BadRequestException(
  //         `steps[${i}].expectedOutcome is required`,
  //       );
  //     }
  //     if (!ALLOWED_ACTIONS.has(step.action)) {
  //       throw new BadRequestException(
  //         `steps[${i}].action must be one of: ${[...ALLOWED_ACTIONS].join(', ')}`,
  //       );
  //     }
  //     if (step.action === 'goto' && !step.value?.trim()) {
  //       throw new BadRequestException(
  //         `steps[${i}].value is required for action "goto"`,
  //       );
  //     }
  //     if (
  //       (step.action === 'click' ||
  //         step.action === 'fill' ||
  //         step.action === 'assertVisible' ||
  //         step.action === 'assertText') &&
  //       !step.selector?.trim()
  //     ) {
  //       throw new BadRequestException(
  //         `steps[${i}].selector is required for action "${step.action}"`,
  //       );
  //     }
  //     if (step.action === 'fill' && step.value === undefined) {
  //       throw new BadRequestException(
  //         `steps[${i}].value is required for action "fill"`,
  //       );
  //     }
  //   }
  // }
}
