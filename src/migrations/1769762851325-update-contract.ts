import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateContract1769762851325 implements MigrationInterface {
    name = 'UpdateContract1769762851325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" ADD "submission_attachments" jsonb`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "submission_links" text`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "submission_description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "submission_description"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "submission_links"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "submission_attachments"`);
    }

}
