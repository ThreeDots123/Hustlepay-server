import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStartDateColumn1771433852995 implements MigrationInterface {
    name = 'AddStartDateColumn1771433852995'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "dueDate"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "durationDays"`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD "started_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD "duration_days" integer`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "duration_days" integer`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "started_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "started_at"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "duration_days"`);
        await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "duration_days"`);
        await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "started_at"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "durationDays" integer`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD "dueDate" TIMESTAMP`);
    }

}
