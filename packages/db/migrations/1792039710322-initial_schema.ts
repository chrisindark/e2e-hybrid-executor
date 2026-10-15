import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1792039710322 implements MigrationInterface {
    name = 'InitialSchema1792039710322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "trace_events" ("eventId" uuid NOT NULL, "stepId" uuid NOT NULL, "runId" uuid NOT NULL, "mode" character varying NOT NULL, "timestamp" TIMESTAMP NOT NULL, "status" text NOT NULL, "durationMs" integer, "actionTaken" text, "reasoning" text, "customerExplanation" text NOT NULL, "error" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ccfb3286362781384ee44947d49" PRIMARY KEY ("eventId"))`);
        await queryRunner.query(`CREATE TABLE "test_versions" ("versionId" uuid NOT NULL, "testId" uuid NOT NULL, "versionNumber" integer NOT NULL, "definitionSnapshot" text NOT NULL, "stepsSnapshot" text NOT NULL, "parentVersionId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_41baef61154484bb9d35b6de46e" PRIMARY KEY ("versionId"))`);
        await queryRunner.query(`CREATE TABLE "test_steps" ("stepId" uuid NOT NULL, "order" integer NOT NULL, "description" text NOT NULL, "action" text NOT NULL, "selector" character varying, "value" text, "expectedOutcome" text NOT NULL, "testId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e6eb4f529d161421683a11009b" PRIMARY KEY ("stepId"))`);
        await queryRunner.query(`CREATE TABLE "step_attempts" ("attemptId" uuid NOT NULL, "runId" uuid NOT NULL, "stepId" uuid NOT NULL, "attemptNumber" integer NOT NULL, "status" character varying NOT NULL, "startedAt" TIMESTAMP NOT NULL, "finishedAt" TIMESTAMP, "error" text, CONSTRAINT "PK_78bd021e10bdf7e818ee166c914" PRIMARY KEY ("attemptId"))`);
        await queryRunner.query(`CREATE TABLE "test_definitions" ("testId" uuid NOT NULL, "name" character varying NOT NULL, "originalIntent" text NOT NULL, "targetUrl" character varying NOT NULL, "currentVersionId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d697c7bcddf662051953708fbe4" PRIMARY KEY ("testId"))`);
        await queryRunner.query(`CREATE TABLE "runs" ("runId" uuid NOT NULL, "testId" uuid NOT NULL, "versionId" uuid, "startedAt" TIMESTAMP NOT NULL, "finishedAt" TIMESTAMP, "error" text, "overallStatus" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4835c0d6b8bfe037a98b921d824" PRIMARY KEY ("runId"))`);
        await queryRunner.query(`CREATE TABLE "promotion_candidates" ("promotionCandidateId" uuid NOT NULL, "runId" uuid NOT NULL, "testId" uuid NOT NULL, "stepId" uuid NOT NULL, "basedVersionId" uuid, "createdVersionId" uuid, "originalStep" text NOT NULL, "proposedStep" text NOT NULL, "reasoning" character varying NOT NULL, "status" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "decidedAt" TIMESTAMP, CONSTRAINT "PK_8c60d091cb29e1f87de6ae9e302" PRIMARY KEY ("promotionCandidateId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "promotion_candidates"`);
        await queryRunner.query(`DROP TABLE "runs"`);
        await queryRunner.query(`DROP TABLE "test_definitions"`);
        await queryRunner.query(`DROP TABLE "step_attempts"`);
        await queryRunner.query(`DROP TABLE "test_steps"`);
        await queryRunner.query(`DROP TABLE "test_versions"`);
        await queryRunner.query(`DROP TABLE "trace_events"`);
    }

}
