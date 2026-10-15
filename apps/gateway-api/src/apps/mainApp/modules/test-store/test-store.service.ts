import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TestDefinition } from '../../../../shared/test-definition.entity';
import { TestStep } from '../../../../shared/test-step.entity';
import { TestVersion } from '../../../../shared/test-version.entity';

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
    @InjectRepository(TestVersion)
    private readonly testVersionRepository: Repository<TestVersion>,
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
    const definition = testDefinition as TestDefinition;
    const steps = testSteps as TestStep[];
    await this.testDefinitionRepository.manager.transaction(async (manager) => {
      await manager.insert(TestDefinition, definition);
      await manager.insert(TestStep, steps);
      const version = await this.createVersion(manager, definition, steps);
      await manager.update(TestDefinition, { testId: definition.testId }, {
        currentVersionId: version.versionId,
      });
    });
    return this.get(definition.testId);
  }

  async update(
    testId: string,
    definitionPatch: Partial<TestDefinition>,
    replacementSteps?: Partial<TestStep>[],
  ) {
    const current = await this.get(testId);
    if (!current.testDefinition) throw new NotFoundException(`Test ${testId} not found`);
    const definition = { ...current.testDefinition, ...definitionPatch, updatedAt: new Date() };
    const steps = replacementSteps
      ? replacementSteps as TestStep[]
      : current.testSteps;
    await this.testDefinitionRepository.manager.transaction(async (manager) => {
      if (replacementSteps) await manager.insert(TestStep, replacementSteps);
      const version = await this.createVersion(
        manager,
        definition,
        steps,
        current.testDefinition?.currentVersionId,
      );
      await manager.update(TestDefinition, { testId }, {
        ...definitionPatch,
        currentVersionId: version.versionId,
      });
    });
    return this.get(testId);
  }

  async get(testId: string) {
    const testDefinition = await this.testDefinitionRepository.findOneBy({
      testId,
    });
    let testSteps = await this.testStepRepository.findBy({ testId });
    let snapshotDefinition = testDefinition;
    if (testDefinition?.currentVersionId) {
      const version = await this.testVersionRepository.findOneBy({
        versionId: testDefinition.currentVersionId,
      });
      if (version) {
        snapshotDefinition = {
          ...testDefinition,
          ...JSON.parse(version.definitionSnapshot),
          currentVersionId: version.versionId,
        };
        testSteps = JSON.parse(version.stepsSnapshot) as TestStep[];
      }
    }

    return {
      testDefinition: snapshotDefinition,
      testSteps: testSteps,
    };
  }

  async list() {
    const testDefinitions = await this.testDefinitionRepository.find();
    return Promise.all(testDefinitions.map(async (definition) => {
      const snapshot = await this.get(definition.testId);
      return { ...snapshot.testDefinition, steps: snapshot.testSteps } as TestStore;
    }));
  }

  async getTestDefinition(testId: string) {
    return await this.testDefinitionRepository.findOneBy({
      testId,
    });
  }

  async getTestStep(stepId: string) {
    const legacyStep = await this.testStepRepository.findOneBy({ stepId });
    if (legacyStep) return legacyStep;
    const definitions = await this.testDefinitionRepository.find();
    for (const definition of definitions) {
      const snapshot = await this.get(definition.testId);
      const step = snapshot.testSteps.find((candidate) => candidate.stepId === stepId);
      if (step) return step;
    }
    return null;
  }

  async updateTestStep(stepId: string, data: Partial<TestStep>) {
    return await this.testStepRepository.update(stepId, data);
  }

  async replaceProposedStep(stepId: string, proposedStep: TestStep) {
    const original = await this.getTestStep(stepId);
    if (!original) throw new NotFoundException(`Test Step ${stepId} not found`);
    return this.promoteProposedStep(original.testId, stepId, proposedStep);
  }

  async getVersion(versionId: string) {
    const version = await this.testVersionRepository.findOneBy({ versionId });
    if (!version) throw new NotFoundException(`Test version ${versionId} not found`);
    const metadata = await this.testDefinitionRepository.findOneBy({ testId: version.testId });
    return {
      version,
      testDefinition: {
        ...metadata,
        ...JSON.parse(version.definitionSnapshot),
        currentVersionId: version.versionId,
      } as TestDefinition,
      testSteps: JSON.parse(version.stepsSnapshot) as TestStep[],
    };
  }

  async promoteProposedStep(
    testId: string,
    stepId: string,
    proposedStep: TestStep,
    basedVersionId?: string,
  ) {
    const current = await this.get(testId);
    if (!current.testDefinition) throw new NotFoundException(`Test ${testId} not found`);
    if (basedVersionId && current.testDefinition.currentVersionId !== basedVersionId) {
      throw new Error('Promotion is based on an outdated test version');
    }
    const steps = current.testSteps.map((step) => step.stepId === stepId
      ? { ...proposedStep, stepId, testId }
      : step);
    if (!steps.some((step) => step.stepId === stepId)) {
      throw new NotFoundException(`Test Step ${stepId} not found`);
    }
    const definition = current.testDefinition;
    const version = await this.testDefinitionRepository.manager.transaction(async (manager) => {
      const created = await this.createVersion(
        manager,
        definition,
        steps,
        definition.currentVersionId,
      );
      await manager.update(TestDefinition, { testId }, { currentVersionId: created.versionId });
      return created;
    });
    return version;
  }

  private async createVersion(
    manager: Repository<TestDefinition>['manager'],
    definition: TestDefinition,
    steps: TestStep[],
    parentVersionId?: string,
  ) {
    const previous = await manager.findOne(TestVersion, {
      where: { testId: definition.testId },
      order: { versionNumber: 'DESC' },
    });
    const version = manager.create(TestVersion, {
      testId: definition.testId,
      versionNumber: (previous?.versionNumber ?? 0) + 1,
      definitionSnapshot: JSON.stringify({
        name: definition.name,
        originalIntent: definition.originalIntent,
        targetUrl: definition.targetUrl,
      }),
      stepsSnapshot: JSON.stringify(steps),
      parentVersionId,
    });
    return manager.save(TestVersion, version);
  }
}
