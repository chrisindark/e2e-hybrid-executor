import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Pool } from 'pg';

@Injectable()
export class PostgresHealthIndicator implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(
    private readonly configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {
    const url =
      configService.get<string>('DATABASE_URL') ??
      'postgresql://orchestrator:orchestrator@localhost:5432/orchestrator';
    this.pool = new Pool({
      connectionString: url,
      max: 2,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 5000,
    });
  }

  async isHealthy(key = 'database') {
    return this.healthIndicatorService
      .check(key)
      .attempt(async ({ signal }) => {
        const result = await this.pool.query<{ ok: number }>('SELECT 1 AS ok');

        if (result.rows[0]?.ok !== 1) {
          throw new Error('Unexpected database ping result');
        }

        return { ok: result };
      })
      .withTimeout(1000);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
