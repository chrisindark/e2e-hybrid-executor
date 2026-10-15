import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '../../../../guards/public.decorator';
import { PostgresHealthIndicator } from './postgres.health';
import { RedisHealthIndicator } from './redis.health';

@Public()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private httpHealthIndicator: HttpHealthIndicator,
    private readonly postgresHealthIndicator: PostgresHealthIndicator,
    private readonly redisHealthIndicator: RedisHealthIndicator,
  ) {}

  /**
   * Liveness probe: is the process alive and able to respond?
   * Deliberately does not check downstream dependencies.
   */
  @Get('liveness')
  @Public()
  @HealthCheck()
  liveness() {
    return this.healthCheckService.check([]);
  }

  /**
   * Readiness probe: is the service ready to receive traffic?
   * Verifies the external dependencies required to serve requests.
   */
  @Get('readiness')
  @Public()
  @HealthCheck()
  readiness() {
    return this.healthCheckService.check([
      () =>
        this.httpHealthIndicator.pingCheck(
          'nestjs-docs',
          'https://docs.nestjs.com',
        ),
      () => this.postgresHealthIndicator.isHealthy('database'),
      () => this.redisHealthIndicator.isHealthy('redis'),
    ]);
  }
}
