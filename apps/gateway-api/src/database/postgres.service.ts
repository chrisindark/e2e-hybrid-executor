import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PostgresService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(PostgresService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    // A superuser (or BYPASSRLS) connection silently ignores every RLS policy.
    // This is the single easiest way to believe isolation works when it does
    // not, so say so loudly at boot.
    const [role] = await this.dataSource.query<
      { role: string; super: boolean }[]
    >(
      `SELECT current_user AS role,
              (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS super`,
    );

    if (role?.super) {
      this.logger.warn(
        `Connected as "${role.role}", a superuser: RLS is NOT enforced. ` +
          'Point DATABASE_APP_URL at a non-superuser role (e.g. app_runtime).',
      );
    }
  }

  async query<T = unknown>(sql: string, parameters?: unknown[]): Promise<T> {
    return this.dataSource.query(sql, parameters);
  }

  async onModuleDestroy() {
    // TypeORM owns this connection pool.
    // Do not close it manually if TypeORM manages its lifecycle.
  }
}
