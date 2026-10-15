import { createMock } from 'test/helpers/mock-factory';
import type { RunService } from '../../../../../modules/run/run.service';

export const mockRunService = () => createMock<RunService>();
