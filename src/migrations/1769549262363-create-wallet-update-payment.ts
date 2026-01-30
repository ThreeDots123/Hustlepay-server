import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWalletUpdatePayment1769549262363 implements MigrationInterface {
    name = 'CreateWalletUpdatePayment1769549262363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wallet" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" character varying NOT NULL, "balance" numeric(12,2) NOT NULL DEFAULT '0', "currency" character varying(10) NOT NULL DEFAULT 'ngn', CONSTRAINT "UQ_72548a47ac4a996cd254b082522" UNIQUE ("user_id"), CONSTRAINT "REL_72548a47ac4a996cd254b08252" UNIQUE ("user_id"), CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD "submission_attachments" jsonb`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD "submission_links" text`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD "submission_description" text`);
        await queryRunner.query(`ALTER TYPE "public"."milestone_user_status_enum" RENAME TO "milestone_user_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."milestone_user_status_enum" AS ENUM('draft', 'pending', 'pending_acceptance', 'accepted', 'payment_initiated', 'submitted', 'approved', 'completed', 'released', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" TYPE "public"."milestone_user_status_enum" USING "user_status"::"text"::"public"."milestone_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."milestone_user_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_user_status_enum" RENAME TO "payments_user_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_user_status_enum" AS ENUM('pending', 'success', 'failed', 'escrowed', 'released', 'refunded', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "user_status" TYPE "public"."payments_user_status_enum" USING "user_status"::"text"::"public"."payments_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."payments_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "FK_72548a47ac4a996cd254b082522" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "FK_72548a47ac4a996cd254b082522"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_user_status_enum_old" AS ENUM('disputed', 'escrowed', 'failed', 'pending', 'refunded', 'success')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "user_status" TYPE "public"."payments_user_status_enum_old" USING "user_status"::"text"::"public"."payments_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."payments_user_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_user_status_enum_old" RENAME TO "payments_user_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."milestone_user_status_enum_old" AS ENUM('accepted', 'approved', 'disputed', 'draft', 'payment_initiated', 'pending', 'pending_acceptance', 'released', 'submitted')`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" TYPE "public"."milestone_user_status_enum_old" USING "user_status"::"text"::"public"."milestone_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."milestone_user_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."milestone_user_status_enum_old" RENAME TO "milestone_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "submission_description"`);
        await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "submission_links"`);
        await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "submission_attachments"`);
        await queryRunner.query(`DROP TABLE "wallet"`);
    }

}
