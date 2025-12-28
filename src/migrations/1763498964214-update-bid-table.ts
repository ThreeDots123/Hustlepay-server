import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBidTable1763498964214 implements MigrationInterface {
    name = 'UpdateBidTable1763498964214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bid" ADD "title" character varying(255) NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."bid_rate_type_enum" AS ENUM('fixed', 'hourly', 'project')`);
        await queryRunner.query(`ALTER TABLE "bid" ADD "rate_type" "public"."bid_rate_type_enum" NOT NULL DEFAULT 'fixed'`);
        await queryRunner.query(`CREATE TYPE "public"."bid_experience_level_enum" AS ENUM('entry', 'intermediate', 'expert')`);
        await queryRunner.query(`ALTER TABLE "bid" ADD "experience_level" "public"."bid_experience_level_enum"`);
        await queryRunner.query(`ALTER TABLE "bid" ADD "portfolio" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "bid" ADD "attachments" jsonb`);
        await queryRunner.query(`ALTER TABLE "bid" ALTER COLUMN "proposedBudget" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bid" ALTER COLUMN "proposedDurationDays" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bid" ALTER COLUMN "proposedDurationDays" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bid" ALTER COLUMN "proposedBudget" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bid" DROP COLUMN "attachments"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP COLUMN "portfolio"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP COLUMN "experience_level"`);
        await queryRunner.query(`DROP TYPE "public"."bid_experience_level_enum"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP COLUMN "rate_type"`);
        await queryRunner.query(`DROP TYPE "public"."bid_rate_type_enum"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP COLUMN "title"`);
    }

}
