import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tenant isolation via PostgreSQL Row-Level Security (01.md §2.2).
 *
 * This maps the RFC's proposed schema onto the tables that actually exist. The
 * RFC assumed `tests` / `test_runs` / `run_attempts` / `run_events` and
 * snake_case columns; the live schema (see 1792039710322-initial_schema.ts) uses
 * `test_definitions` / `runs` / `step_attempts` / `trace_events` with camelCase
 * column names, so this migration follows the live convention throughout.
 *
 * !! RLS IS INERT UNTIL THE APP STOPS CONNECTING AS A SUPERUSER !!
 * `FORCE ROW LEVEL SECURITY` makes the policies apply to the table owner too,
 * but *nothing* overrides a superuser. The docker-compose `POSTGRES_USER`
 * (`orchestrator`) is created as a superuser, so today these policies are
 * bypassed at runtime. Point the app at a dedicated non-superuser role before
 * treating RLS as a security boundary. See 01.md §3.1.
 */

/** Tables that hold tenant data. */
const TENANT_TABLES: readonly string[] = [
  'test_definitions',
  'test_versions',
  'test_steps',
  'runs',
  'step_attempts',
  'trace_events',
  'promotion_candidates',
];

/**
 * Deterministic tenant that pre-existing (single-tenant) rows are backfilled to.
 * Only inserted when there is actually data to backfill.
 */
const BOOTSTRAP_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export class TenantIsolationRls1792066610064 implements MigrationInterface {
  name = 'TenantIsolationRls1792066610064';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() is core in PG13+, but pgcrypto keeps this portable.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "tenantId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(64) NOT NULL,
        "name" character varying(255) NOT NULL,
        "planTier" character varying(32) NOT NULL DEFAULT 'free',
        "maxConcurrentRuns" integer NOT NULL DEFAULT 2,
        "monthlyRunQuota" integer NOT NULL DEFAULT 500,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants_tenantId" PRIMARY KEY ("tenantId"),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug")
      )
    `);

    // 1. Add the column as nullable so existing rows are not rejected outright.
    for (const table of TENANT_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "tenantId" uuid`);
    }

    // 2. Seed a bootstrap tenant only if there is legacy data to attach.
    await queryRunner.query(`
      DO $$
      DECLARE
        bootstrap_id uuid := '${BOOTSTRAP_TENANT_ID}';
        existing_rows bigint;
      BEGIN
        SELECT ${TENANT_TABLES.map(
          (table) => `(SELECT count(*) FROM "${table}")`,
        ).join(' + ')} INTO existing_rows;

        IF existing_rows > 0 THEN
          INSERT INTO "tenants" ("tenantId", "slug", "name", "planTier")
          VALUES (bootstrap_id, 'default', 'Default tenant', 'free')
          ON CONFLICT ("tenantId") DO NOTHING;
        END IF;
      END $$;
    `);

    // 3. Backfill, then tighten to NOT NULL and wire up the FK + lookup index.
    for (const table of TENANT_TABLES) {
      await queryRunner.query(
        `UPDATE "${table}" SET "tenantId" = '${BOOTSTRAP_TENANT_ID}' WHERE "tenantId" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "tenantId" SET NOT NULL`,
      );
      await queryRunner.query(`
        ALTER TABLE "${table}"
          ADD CONSTRAINT "FK_${table}_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId")
          ON DELETE CASCADE
      `);
      await queryRunner.query(
        `CREATE INDEX "IDX_${table}_tenantId" ON "${table}" ("tenantId")`,
      );
    }

    // Composite indexes that match the access patterns the RFC called out.
    await queryRunner.query(
      `CREATE INDEX "IDX_test_versions_tenantId_testId" ON "test_versions" ("tenantId", "testId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_runs_tenantId_overallStatus" ON "runs" ("tenantId", "overallStatus")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_trace_events_tenantId_runId" ON "trace_events" ("tenantId", "runId")`,
    );

    // 4. Session-scoped tenant lookup used by every policy.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
      BEGIN
        RETURN NULLIF(current_setting('app.tenant_id', true), '')::uuid;
      END;
      $$ LANGUAGE plpgsql STABLE
    `);

    // 5. Enable + force RLS and install the per-table policy.
    for (const table of TENANT_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
      // Without FORCE, the table owner (the app's current role) ignores the policy.
      await queryRunner.query(
        `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(`
        CREATE POLICY "tenant_isolation_${table}" ON "${table}"
          FOR ALL
          USING ("tenantId" = current_tenant_id())
          WITH CHECK ("tenantId" = current_tenant_id())
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_test_versions_tenantId_testId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_runs_tenantId_overallStatus"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trace_events_tenantId_runId"`);

    for (const table of [...TENANT_TABLES].reverse()) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "FK_${table}_tenant"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_${table}_tenantId"`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "tenantId"`);
    }

    await queryRunner.query(`DROP FUNCTION IF EXISTS current_tenant_id()`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
