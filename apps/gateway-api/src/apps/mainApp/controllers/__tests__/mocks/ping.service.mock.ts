import { createMock } from 'test/helpers/mock-factory';
import type { PingService } from '../../../../../modules/ping/ping.service';

export const mockPingService = () => createMock<PingService>();
