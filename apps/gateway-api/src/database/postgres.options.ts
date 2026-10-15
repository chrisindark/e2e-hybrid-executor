import { join, resolve } from 'node:path';

import { Logger } from '@nestjs/common';
import type { DataSourceOptions } from 'typeorm';

const DEFAULT_URL =
  'postgresql://orchestrator:orchestrator@localhost:5432/orchestrator';

export type TypeOrmRole = 'runtime' | 'migration';

/**
 * Runtime traffic must connect as a non-superuser role, otherwise PostgreSQL
 * bypasses every RLS policy and tenant isolation is silently inert. Migrations
 * run as the owning role instead, because `app_runtime` cannot execute DDL.
 */
export function getTypeOrmOptions(
  role: TypeOrmRole = 'runtime',
): DataSourceOptions {
  const url =
    role === 'runtime'
      ? (process.env.DATABASE_APP_URL ??
        process.env.DATABASE_URL ??
        DEFAULT_URL)
      : (process.env.DATABASE_URL ?? DEFAULT_URL);

  if (role === 'runtime' && (process.env.DATABASE_APP_URL ?? '') === '') {
    new Logger('TypeOrmOptions').warn(
      'DATABASE_APP_URL is not set; falling back to DATABASE_URL. If that role ' +
        'is a superuser or owns the tables, RLS will not be enforced.',
    );
  }

  return {
    type: 'postgres',
    url,

    // Finds your existing TypeORM entities in source or compiled output.
    entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],

    // Migration files live in packages/db.
    migrations: [
      resolve(__dirname, '../../../../packages/db/migrations/*{.ts,.js}'),
    ],

    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
    synchronize: false,
  };
}
