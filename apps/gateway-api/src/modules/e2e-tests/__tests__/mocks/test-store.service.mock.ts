import { createMock } from 'test/helpers/mock-factory';
import type { TestStoreService } from '../../../test-store/test-store.service';

export const mockTestStoreService = () => createMock<TestStoreService>();
