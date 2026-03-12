import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewUserStatus1772422932596 implements MigrationInterface {
    name = 'AddNewUserStatus1772422932596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_user_status_enum" RENAME TO "user_user_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_user_status_enum" AS ENUM('active', 'suspended', 'pending', 'not_activated')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "user_status" TYPE "public"."user_user_status_enum" USING "user_status"::"text"::"public"."user_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "user_status" SET DEFAULT 'not_activated'`);
        await queryRunner.query(`DROP TYPE "public"."user_user_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_user_status_enum_old" AS ENUM('active', 'suspended', 'pending')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "user_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "user_status" TYPE "public"."user_user_status_enum_old" USING "user_status"::"text"::"public"."user_user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "user_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."user_user_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_user_status_enum_old" RENAME TO "user_user_status_enum"`);
    }

}
