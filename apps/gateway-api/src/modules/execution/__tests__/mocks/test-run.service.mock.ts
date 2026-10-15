import { createMock } from 'test/helpers/mock-factory';
import type { TestRunService } from '../../../test-run/test-run.service';

export const mockTestRunService = () => createMock<TestRunService>();
