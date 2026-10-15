import { join, resolve } from 'node:path';

import type { DataSourceOptions } from 'typeorm';

export function getTypeOrmOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    url:
      process.env.DATABASE_URL ??
      'postgresql://orchestrator:orchestrator@localhost:5432/orchestrator',

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
