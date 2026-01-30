import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeliverables1768967679362 implements MigrationInterface {
    name = 'CreateDeliverables1768967679362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."deliverable_user_status_enum" AS ENUM('pending', 'completed', 'verified')`);
        await queryRunner.query(`CREATE TABLE "deliverable" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "contract_id" character varying, "milestone_id" character varying, "title" character varying(255) NOT NULL, "description" text, "order" integer NOT NULL DEFAULT '0', "user_status" "public"."deliverable_user_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_fbed21e1ad3464d9fb7729ad51d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "deliverable" ADD CONSTRAINT "FK_9a29cc5493000f6aaa7a88155f8" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deliverable" ADD CONSTRAINT "FK_a5e558dce118e46b1ecef48765a" FOREIGN KEY ("milestone_id") REFERENCES "milestone"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deliverable" DROP CONSTRAINT "FK_a5e558dce118e46b1ecef48765a"`);
        await queryRunner.query(`ALTER TABLE "deliverable" DROP CONSTRAINT "FK_9a29cc5493000f6aaa7a88155f8"`);
        await queryRunner.query(`DROP TABLE "deliverable"`);
        await queryRunner.query(`DROP TYPE "public"."deliverable_user_status_enum"`);
    }

}
