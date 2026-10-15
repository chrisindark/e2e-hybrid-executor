import { Injectable } from '@nestjs/common';
import { TENANT_SETTING } from '@repo/db';
import { DataSource, QueryRunner } from 'typeorm';

import { runInTenantScope } from './tenant-context';

/**
 * Runs a unit of work on a connection dedicated to a single tenant, with the
 * `TENANT_SETTING` GUC set, so the RLS policies on every isolated table resolve.
 * The setting's name comes from `@repo/db` — it is the shared contract with the
 * worker-side `TenantDatabaseClient`, and a typo here would disable RLS rather
 * than raise an error.
 *
 * The setting is session-scoped (`set_config(..., false)`) rather than
 * `SET LOCAL`. Two reasons:
 *
 *  - Services own their own transactions (`manager.transaction(...)`), and a
 *    fire-and-forget run legitimately outlives the HTTP request that started
 *    it, so there is no single transaction to scope the setting to.
 *  - Session scope is safe here precisely because the connection is *exclusive*
 *    to this unit of work: it comes from a dedicated `QueryRunner`, so no other
 *    request can be handed the same session. It is cleared before the
 *    connection goes back to the pool.
 */
@Injectable()
export class TenantTransactionService {
  constructor(private readonly dataSource: DataSource) {}

  async runWithTenant<T>(tenantId: string, work: () => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SELECT set_config($1, $2, false)`, [
        TENANT_SETTING,
        tenantId,
      ]);

      return await runInTenantScope(
        { tenantId, manager: queryRunner.manager },
        work,
      );
    } finally {
      await this.clearAndRelease(queryRunner);
    }
  }

  private async clearAndRelease(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`SELECT set_config($1, '', false)`, [
        TENANT_SETTING,
      ]);
    } catch {
      // The connection is already unusable; releasing it is what matters.
    }

    await queryRunner.release();
  }
}
