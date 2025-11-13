import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlugProposal1762634515935 implements MigrationInterface {
    name = 'AddSlugProposal1762634515935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposal" ADD "slug" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "proposal" ADD CONSTRAINT "UQ_894de7603d8172deb20277c6f56" UNIQUE ("slug")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposal" DROP CONSTRAINT "UQ_894de7603d8172deb20277c6f56"`);
        await queryRunner.query(`ALTER TABLE "proposal" DROP COLUMN "slug"`);
    }

}
