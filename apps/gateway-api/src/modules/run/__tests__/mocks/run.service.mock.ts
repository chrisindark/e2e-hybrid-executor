import { createMock } from 'test/helpers/mock-factory';
import type { RunService } from '../../run.service';

export const mockRunService = () => createMock<RunService>();
