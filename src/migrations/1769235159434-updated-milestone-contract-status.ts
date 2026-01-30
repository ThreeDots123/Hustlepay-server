import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedMilestoneContractStatus1769235159434 implements MigrationInterface {
    name = 'UpdatedMilestoneContractStatus1769235159434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."milestone_user_status_enum" RENAME TO "milestone_user_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."milestone_user_status_enum" AS ENUM('draft', 'pending', 'pending_acceptance', 'accepted', 'payment_initiated', 'submitted', 'approved', 'released', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" TYPE "public"."milestone_user_status_enum" USING "user_status"::"text"::"public"."milestone_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."milestone_user_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."contract_user_status_enum" RENAME TO "contract_user_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."contract_user_status_enum" AS ENUM('pending_client_approval', 'awaiting_payment', 'payment_initiated', 'active', 'paused', 'completed', 'cancelled', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" TYPE "public"."contract_user_status_enum" USING "user_status"::"text"::"public"."contract_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" SET DEFAULT 'awaiting_payment'`);
        await queryRunner.query(`DROP TYPE "public"."contract_user_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."contract_user_status_enum_old" AS ENUM('pending_client_approval', 'awaiting_payment', 'active', 'completed', 'cancelled', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" TYPE "public"."contract_user_status_enum_old" USING "user_status"::"text"::"public"."contract_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" SET DEFAULT 'awaiting_payment'`);
        await queryRunner.query(`DROP TYPE "public"."contract_user_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."contract_user_status_enum_old" RENAME TO "contract_user_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."milestone_user_status_enum_old" AS ENUM('draft', 'pending', 'pending_acceptance', 'accepted', 'submitted', 'approved', 'released', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" TYPE "public"."milestone_user_status_enum_old" USING "user_status"::"text"::"public"."milestone_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "milestone" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."milestone_user_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."milestone_user_status_enum_old" RENAME TO "milestone_user_status_enum"`);
    }

}
