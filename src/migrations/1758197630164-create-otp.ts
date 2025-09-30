import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOtp1758197630164 implements MigrationInterface {
    name = 'CreateOtp1758197630164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."otp_purpose_enum" AS ENUM('email_verification', 'password_reset', 'passwordless_login')`);
        await queryRunner.query(`CREATE TABLE "otp" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" character varying NOT NULL, "code" character varying NOT NULL, "purpose" "public"."otp_purpose_enum" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used" boolean NOT NULL DEFAULT false, "attempts" integer NOT NULL DEFAULT '0', "max_attempts" integer NOT NULL DEFAULT '3', CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "client_profile" ALTER COLUMN "country" SET DEFAULT 'NGN'`);
        await queryRunner.query(`ALTER TABLE "otp" ADD CONSTRAINT "FK_258d028d322ea3b856bf9f12f25" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp" DROP CONSTRAINT "FK_258d028d322ea3b856bf9f12f25"`);
        await queryRunner.query(`ALTER TABLE "client_profile" ALTER COLUMN "country" DROP DEFAULT`);
        await queryRunner.query(`DROP TABLE "otp"`);
        await queryRunner.query(`DROP TYPE "public"."otp_purpose_enum"`);
    }

}
