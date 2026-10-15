import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {
    const url =
      configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableOfflineQueue: false,
    });
  }

  async isHealthy(key = 'redis') {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }

    const pong = await this.client.ping();

    if (pong !== 'PONG') {
      throw new Error(`Unexpected Redis ping response: ${pong}`);
    }

    return this.healthIndicatorService
      .check(key)
      .attempt(async ({ signal }) => {
        const pong = await this.client.ping();

        if (pong !== 'PONG') {
          throw new Error(`Unexpected Redis ping response: ${pong}`);
        }

        return { ok: pong };
      })
      .withTimeout(1000);
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}
