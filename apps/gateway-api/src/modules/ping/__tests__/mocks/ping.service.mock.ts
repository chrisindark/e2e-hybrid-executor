import { createMock } from 'test/helpers/mock-factory';
import type { PingService } from '../../ping.service';

export const mockPingService = () => createMock<PingService>();
