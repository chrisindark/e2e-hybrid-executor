import { Test } from '@nestjs/testing';

/**
 * Helper to build a NestJS TestingModule with minimal boilerplate.
 * Returns the compiled module ready for .get() lookups.
 *
 * @example
 *   const module = await createTestingModule({
 *     providers: [MyService, { provide: MyDependency, useValue: mockMyDependency() }],
 *   });
 *   const service = module.get(MyService);
 */
export async function createTestingModule(metadata: Parameters<typeof Test.createTestingModule>[0]) {
  const moduleRef = await Test.createTestingModule(metadata).compile();

  return moduleRef;
}
