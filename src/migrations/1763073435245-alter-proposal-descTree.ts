import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterProposalDescTree1763073435245 implements MigrationInterface {
    name = 'AlterProposalDescTree1763073435245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposal" ADD "descriptionTree" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposal" DROP COLUMN "descriptionTree"`);
    }

}
