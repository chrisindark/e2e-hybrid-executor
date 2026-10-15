import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { PostgresHealthIndicator } from './postgres.health';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [TerminusModule],
  providers: [PostgresHealthIndicator, RedisHealthIndicator],
  exports: [TerminusModule, PostgresHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
