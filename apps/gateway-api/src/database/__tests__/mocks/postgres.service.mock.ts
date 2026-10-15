import { createMock } from 'test/helpers/mock-factory';
import type { PostgresService } from '../../postgres.service';

export const mockPostgresService = () => createMock<PostgresService>();
