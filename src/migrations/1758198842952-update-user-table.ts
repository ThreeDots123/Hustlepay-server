import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserTable1758198842952 implements MigrationInterface {
    name = 'UpdateUserTable1758198842952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "is_verified" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_verified"`);
    }

}
