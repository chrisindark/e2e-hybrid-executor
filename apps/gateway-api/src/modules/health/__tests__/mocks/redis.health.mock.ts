import { createMock } from 'test/helpers/mock-factory';
import type { RedisHealthIndicator } from '../../redis.health';

export const mockRedisHealthIndicator = () =>
  createMock<RedisHealthIndicator>();
