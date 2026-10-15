import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PostgresService implements OnModuleDestroy {
  constructor(private readonly dataSource: DataSource) {}

  async query<T = unknown>(sql: string, parameters?: unknown[]): Promise<T> {
    return this.dataSource.query(sql, parameters);
  }

  async onModuleDestroy() {
    // TypeORM owns this connection pool.
    // Do not close it manually if TypeORM manages its lifecycle.
  }
}
