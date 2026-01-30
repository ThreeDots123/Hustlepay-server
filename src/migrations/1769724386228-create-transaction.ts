import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTransaction1769724386228 implements MigrationInterface {
    name = 'CreateTransaction1769724386228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_transaction_type_enum" AS ENUM('payment_received', 'escrowed', 'released', 'withdrawn', 'payment_made', 'escrowed_payment', 'refunded', 'contract_payment', 'milestone_payment')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_user_status_enum" AS ENUM('pending', 'completed', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" character varying NOT NULL, "transaction_type" "public"."transactions_transaction_type_enum" NOT NULL, "amount" integer NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'ngn', "user_status" "public"."transactions_user_status_enum" NOT NULL DEFAULT 'pending', "description" text, "contract_id" character varying, "milestone_id" character varying, "payment_id" character varying, "wallet_id" character varying, "metadata" jsonb, "balance_after" numeric(12,2), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e9acc6efa76de013e8c1553ed2" ON "transactions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7cc73998748f3d191dc3297428" ON "transactions" ("transaction_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_70a830bdd72675a510ecb73386" ON "transactions" ("user_status") `);
        await queryRunner.query(`CREATE INDEX "IDX_bfe2efd1fdd9675f2f64d75d51" ON "transactions" ("contract_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2ff66c8816a9faeba75de3aa01" ON "transactions" ("milestone_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_464da95dc8a05470b2b158d4df" ON "transactions" ("payment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0b171330be0cb621f8d73b87a9" ON "transactions" ("wallet_id") `);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_bfe2efd1fdd9675f2f64d75d51c" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_2ff66c8816a9faeba75de3aa01d" FOREIGN KEY ("milestone_id") REFERENCES "milestone"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_464da95dc8a05470b2b158d4df6" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_464da95dc8a05470b2b158d4df6"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_2ff66c8816a9faeba75de3aa01d"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_bfe2efd1fdd9675f2f64d75d51c"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b171330be0cb621f8d73b87a9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_464da95dc8a05470b2b158d4df"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ff66c8816a9faeba75de3aa01"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bfe2efd1fdd9675f2f64d75d51"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_70a830bdd72675a510ecb73386"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7cc73998748f3d191dc3297428"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9acc6efa76de013e8c1553ed2"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_user_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_transaction_type_enum"`);
    }

}
