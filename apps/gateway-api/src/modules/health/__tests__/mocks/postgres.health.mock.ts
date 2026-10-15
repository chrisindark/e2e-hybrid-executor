import { createMock } from 'test/helpers/mock-factory';
import type { PostgresHealthIndicator } from '../../postgres.health';

export const mockPostgresHealthIndicator = () =>
  createMock<PostgresHealthIndicator>();
