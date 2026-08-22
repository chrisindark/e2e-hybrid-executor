import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TestDefinition } from '../../../../shared/test-definition.entity';
import { TestStep } from '../../../../shared/test-step.entity';

export type TestStore = TestDefinition & { steps: TestStep[] };

@Injectable()
export class TestStoreService {
  private readonly logger = new Logger(TestStoreService.name);

  private tests = new Map<string, TestDefinition>();

  constructor(
    @InjectRepository(TestDefinition)
    private readonly testDefinitionRepository: Repository<TestDefinition>,
    @InjectRepository(TestStep)
    private readonly testStepRepository: Repository<TestStep>,
  ) {}

  tempSave(test: TestDefinition): TestDefinition {
    this.tests.set(test.testId, test);

    return test;
  }

  tempExists(testId: string): boolean {
    return this.tests.has(testId);
  }

  tempGet(testId: string): TestDefinition {
    const test = this.tests.get(testId);

    if (!test) throw new NotFoundException(`Test ${testId} not found`);

    return test;
  }

  tempList(): TestDefinition[] {
    return Array.from(this.tests.values());
  }

  tempDelete(testId: string): void {
    if (!this.tests.delete(testId)) {
      throw new NotFoundException(`Test ${testId} not found`);
    }
  }

  async save(
    testDefinition: Partial<TestDefinition>,
    testSteps: Partial<TestStep>[],
  ) {
    const insertedTestDefinition =
      await this.testDefinitionRepository.insert(testDefinition);
    const insertedTestSteps = await this.testStepRepository.insert(testSteps);

    return { ...insertedTestDefinition, steps: insertedTestSteps };
  }

  async update(
    testId: string,
    definitionPatch: Partial<TestDefinition>,
    replacementSteps?: Partial<TestStep>[],
  ) {
    await this.testDefinitionRepository.manager.transaction(async (manager) => {
      if (Object.keys(definitionPatch).length > 0) {
        await manager.update(TestDefinition, { testId }, definitionPatch);
      }

      if (replacementSteps) {
        await manager.delete(TestStep, { testId });
        await manager.insert(TestStep, replacementSteps);
      }
    });

    return this.get(testId);
  }

  async get(testId: string) {
    const testDefinition = await this.testDefinitionRepository.findOneBy({
      testId,
    });
    const testSteps = await this.testStepRepository.findBy({
      testId,
    });

    return {
      testDefinition: testDefinition,
      testSteps: testSteps,
    };
  }

  async list() {
    const testDefinitions = await this.testDefinitionRepository.find();
    const testSteps = await this.testStepRepository.find();

    const testStoreList: TestStore[] = [];
    testDefinitions.map((td) => {
      const testStore = { ...td } as TestStore;

      const steps: TestStep[] = testSteps.filter((v) => (td.testId = v.testId));
      testStore.steps = steps;

      testStoreList.push(testStore);
    });

    return testStoreList;
  }

  async getTestDefinition(testId: string) {
    return await this.testDefinitionRepository.findOneBy({
      testId,
    });
  }

  async getTestStep(stepId: string) {
    return await this.testStepRepository.findOneBy({
      stepId,
    });
  }

  async updateTestStep(stepId: string, data: Partial<TestStep>) {
    return await this.testStepRepository.update(stepId, data);
  }

  async replaceProposedStep(stepId: string, proposedStep: TestStep) {
    const originalTestStep = await this.getTestStep(stepId);

    if (!originalTestStep) {
      throw new NotFoundException(`Test Step ${stepId} not found`);
    }

    const updatedTestStepResponse = await this.updateTestStep(
      stepId,
      proposedStep,
    );
    this.logger.debug(`Updated test step response: ${updatedTestStepResponse}`);

    return updatedTestStepResponse;
  }
}
