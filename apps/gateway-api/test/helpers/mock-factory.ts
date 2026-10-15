/**
 * Generic auto-mock factory. Creates a Proxy that returns jest.fn() for any
 * property access. Use this to quickly mock any service/repository dependency
 * without manually defining every method.
 *
 * @example
 *   const mockRepo = createMock<Repository<Run>>();
 *   mockRepo.findOne.mockResolvedValue(buildRun());
 */
export type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : T[K];
};

export function createMock<T extends object>(): Mocked<T> {
  const store = new Map<string | symbol, unknown>();

  return new Proxy({} as Mocked<T>, {
    get(_target, prop) {
      if (!store.has(prop)) {
        store.set(prop, jest.fn());
      }
      return store.get(prop);
    },
    set(_target, prop, value) {
      store.set(prop, value);
      return true;
    },
  });
}

export const mockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

export const mockConfigService = (
  overrides: Record<string, unknown> = {},
) => ({
  get: jest.fn((key: string, defaultValue?: unknown) =>
    key in overrides ? overrides[key] : defaultValue,
  ),
  getOrThrow: jest.fn((key: string) => {
    if (key in overrides) return overrides[key];
    throw new Error(`Missing config: ${key}`);
  }),
});

export const mockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  findOneBy: jest.fn().mockResolvedValue(null),
  findBy: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockResolvedValue({ identifiers: [] }),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  create: jest.fn().mockImplementation((dto) => dto),
  count: jest.fn().mockResolvedValue(0),
  manager: {
    transaction: jest.fn((cb) => cb(mockEntityManager())),
    insert: jest.fn().mockResolvedValue({ identifiers: [] }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  },
});

export const mockEntityManager = () => ({
  insert: jest.fn().mockResolvedValue({ identifiers: [] }),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
});
