import { Pool, PoolClient } from 'pg';

/**
 * Name of the PostgreSQL GUC that carries the active tenant. The RLS policies
 * read it via `current_tenant_id()`, so this string *is* the contract between
 * the database and every client that sets it. It lives here so the two clients
 * — this one (`pg`) and the gateway's TypeORM one — cannot disagree on the
 * spelling; a typo on either side would silently turn RLS off rather than fail.
 *
 * Migrations deliberately do not import this: they are historical records and
 * must keep the literal they were applied with.
 */
export const TENANT_SETTING = 'app.tenant_id';

export class TenantDatabaseClient {
  constructor(private readonly pool: Pool) {}

  async withTenant<T>(
    tenantId: string,
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', [
        TENANT_SETTING,
        tenantId,
      ]);

      const result = await operation(client);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async withSystemAdmin<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL ROLE 'platform_admin'");
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export { Pool, PoolClient };
