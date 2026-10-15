import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Runtime roles + tenant defaults (01.md §3.1, steps 3 and 4).
 *
 * Two things must be true before RLS protects anything:
 *
 *  1. `tenantId` must be derived from the session on every insert, so the
 *     application never has to supply it. Each isolated column gains
 *     `DEFAULT current_tenant_id()`, which reads the `app.tenant_id` GUC set by
 *     `TenantTransactionService`.
 *  2. The process must connect as a role that RLS actually applies to. The
 *     docker `POSTGRES_USER` (`orchestrator`) is a SUPERUSER with BYPASSRLS, and
 *     superusers ignore RLS unconditionally — `FORCE ROW LEVEL SECURITY` does
 *     not help. So this migration adds:
 *
 *     - `app_runtime`    LOGIN, NOSUPERUSER, NOBYPASSRLS, NOINHERIT. The role
 *                        the gateway connects as (`DATABASE_APP_URL`).
 *     - `platform_admin` NOLOGIN, BYPASSRLS. Reached only through an explicit
 *                        `SET LOCAL ROLE` for system-level work
 *                        (`TenantDatabaseClient.withSystemAdmin`).
 *
 * `app_runtime` is NOINHERIT and therefore does not pick up `platform_admin`'s
 * BYPASSRLS just by being a member: it only bypasses while the role is active.
 *
 * The password comes from `APP_DB_PASSWORD` and falls back to the local-dev
 * value `app_runtime`. Override it in every non-local environment.
 */

const TENANT_TABLES: readonly string[] = [
  'test_definitions',
  'test_versions',
  'test_steps',
  'runs',
  'step_attempts',
  'trace_events',
  'promotion_candidates',
];

const APP_ROLE = 'app_runtime';
const ADMIN_ROLE = 'platform_admin';

export class TenantRolesAndDefaults1792069042212 implements MigrationInterface {
  name = 'TenantRolesAndDefaults1792069042212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tenant identity is a database concern, not a payload concern.
    for (const table of TENANT_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "tenantId" SET DEFAULT current_tenant_id()`,
      );
    }

    const password = (process.env.APP_DB_PASSWORD ?? 'app_runtime').replace(
      /'/g,
      "''",
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${ADMIN_ROLE}') THEN
          CREATE ROLE "${ADMIN_ROLE}" NOLOGIN BYPASSRLS;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN
          CREATE ROLE "${APP_ROLE}" LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOINHERIT PASSWORD '${password}';
        ELSE
          ALTER ROLE "${APP_ROLE}" LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOINHERIT PASSWORD '${password}';
        END IF;
      END $$;
    `);

    // 2. Collecting privileges for both roles; platform_admin needs its own
    //    grants because NOINHERIT means app_runtime's grants are not active
    //    while that role is assumed.
    for (const role of [APP_ROLE, ADMIN_ROLE]) {
      await queryRunner.query(`GRANT USAGE ON SCHEMA public TO "${role}"`);

      for (const table of TENANT_TABLES) {
        await queryRunner.query(
          `GRANT SELECT, INSERT, UPDATE, DELETE ON "${table}" TO "${role}"`,
        );
      }

      await queryRunner.query(
        `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${role}"`,
      );
      await queryRunner.query(
        `GRANT EXECUTE ON FUNCTION current_tenant_id() TO "${role}"`,
      );
      await queryRunner.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${role}"`,
      );
      await queryRunner.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "${role}"`,
      );
    }

    // 3. `tenants` is not RLS-isolated: everyone may read it, only the system
    //    role may mutate it.
    await queryRunner.query(
      `GRANT SELECT ON "tenants" TO "${APP_ROLE}"`,
    );
    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON "tenants" TO "${ADMIN_ROLE}"`,
    );

    await queryRunner.query(`GRANT "${ADMIN_ROLE}" TO "${APP_ROLE}"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const role of [APP_ROLE, ADMIN_ROLE]) {
      await queryRunner.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM "${role}"`,
      );
      await queryRunner.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM "${role}"`,
      );
      await queryRunner.query(
        `REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM "${role}"`,
      );
      await queryRunner.query(
        `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM "${role}"`,
      );
      await queryRunner.query(
        `REVOKE ALL ON SCHEMA public FROM "${role}"`,
      );
    }

    await queryRunner.query(`REVOKE "${ADMIN_ROLE}" FROM "${APP_ROLE}"`);
    await queryRunner.query(`DROP ROLE IF EXISTS "${APP_ROLE}"`);
    await queryRunner.query(`DROP ROLE IF EXISTS "${ADMIN_ROLE}"`);

    for (const table of TENANT_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "tenantId" DROP DEFAULT`,
      );
    }
  }
}
