import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOtp1770534648558 implements MigrationInterface {
    name = 'UpdateOtp1770534648558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp" ADD "token" character varying`);
        await queryRunner.query(`ALTER TABLE "otp" ADD CONSTRAINT "UQ_e4517a2b70b8a4ec8bb22f30cfa" UNIQUE ("token")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp" DROP CONSTRAINT "UQ_e4517a2b70b8a4ec8bb22f30cfa"`);
        await queryRunner.query(`ALTER TABLE "otp" DROP COLUMN "token"`);
    }

}
