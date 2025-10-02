import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateGigTags1759405627155 implements MigrationInterface {
    name = 'UpdateGigTags1759405627155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gig" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "gig" ADD "tags" text array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gig" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "gig" ADD "tags" text`);
    }

}
