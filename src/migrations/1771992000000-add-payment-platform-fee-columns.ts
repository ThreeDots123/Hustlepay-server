import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentPlatformFeeColumns1771992000000
  implements MigrationInterface
{
  name = "AddPaymentPlatformFeeColumns1771992000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "subtotal_amount" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "platform_fee_amount" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "platform_fee_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "subtotal_amount"`,
    );
  }
}
