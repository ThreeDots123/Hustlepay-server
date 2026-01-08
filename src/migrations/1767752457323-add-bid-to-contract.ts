import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBidToContract1767752457323 implements MigrationInterface {
    name = 'AddBidToContract1767752457323'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" ADD "bid_id" character varying`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "durationDays" integer`);
        await queryRunner.query(`CREATE TYPE "public"."contract_rate_type_enum" AS ENUM('fixed', 'hourly', 'project')`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "rate_type" "public"."contract_rate_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."contract_user_status_enum" RENAME TO "contract_user_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."contract_user_status_enum" AS ENUM('pending_client_approval', 'awaiting_payment', 'active', 'completed', 'cancelled', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" TYPE "public"."contract_user_status_enum" USING "user_status"::"text"::"public"."contract_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" SET DEFAULT 'awaiting_payment'`);
        await queryRunner.query(`DROP TYPE "public"."contract_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD CONSTRAINT "FK_3ab260c855301c832045109d3fc" FOREIGN KEY ("bid_id") REFERENCES "bid"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP CONSTRAINT "FK_3ab260c855301c832045109d3fc"`);
        await queryRunner.query(`CREATE TYPE "public"."contract_user_status_enum_old" AS ENUM('awaiting_payment', 'active', 'completed', 'cancelled', 'disputed')`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" TYPE "public"."contract_user_status_enum_old" USING "user_status"::"text"::"public"."contract_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "user_status" SET DEFAULT 'awaiting_payment'`);
        await queryRunner.query(`DROP TYPE "public"."contract_user_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."contract_user_status_enum_old" RENAME TO "contract_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "rate_type"`);
        await queryRunner.query(`DROP TYPE "public"."contract_rate_type_enum"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "durationDays"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "bid_id"`);
    }

}
