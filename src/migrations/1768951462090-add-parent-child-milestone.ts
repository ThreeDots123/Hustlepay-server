import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentChildMilestone1768951462090 implements MigrationInterface {
    name = 'AddParentChildMilestone1768951462090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestone" ADD "parent_id" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."milestone_user_status_enum" RENAME TO "milestone_user_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."milestone_user_status_enum" AS ENUM('draft', 'pending', 'pending_acceptance', 'accepted', 'submitted', 'approved', 'released', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" TYPE "public"."milestone_user_status_enum" USING "user_status"::"text"::"public"."milestone_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."milestone_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD CONSTRAINT "FK_5e26a67a17774d9f0dca86cc6fe" FOREIGN KEY ("parent_id") REFERENCES "milestone"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestone" DROP CONSTRAINT "FK_5e26a67a17774d9f0dca86cc6fe"`);
        await queryRunner.query(`CREATE TYPE "public"."milestone_user_status_enum_old" AS ENUM('pending', 'submitted', 'approved', 'released', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" TYPE "public"."milestone_user_status_enum_old" USING "user_status"::"text"::"public"."milestone_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."milestone_user_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."milestone_user_status_enum_old" RENAME TO "milestone_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "parent_id"`);
    }

}
