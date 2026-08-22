import { Module } from '@nestjs/common';

import { PingController } from '../../modules/ping/ping.controller';
import { PingService } from '../../modules/ping/ping.service';

@Module({
  imports: [],
  providers: [PingService],
  controllers: [PingController],
  exports: [PingService],
})
export class PingModule {}
