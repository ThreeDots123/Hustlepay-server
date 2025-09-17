import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserPswrdTables1758092216005 implements MigrationInterface {
    name = 'CreateUserPswrdTables1758092216005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "password" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key" character varying NOT NULL, "user_id" character varying NOT NULL, CONSTRAINT "REL_4cd77c9b2e2522ee9d3671b3bc" UNIQUE ("user_id"), CONSTRAINT "PK_cbeb55948781be9257f44febfa0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_auth_method_enum" AS ENUM('password', 'gmail', 'passwordless')`);
        await queryRunner.query(`CREATE TYPE "public"."user_user_role_enum" AS ENUM('freelancer', 'admin', 'client')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "auth_method" "public"."user_auth_method_enum" NOT NULL DEFAULT 'password', "user_role" "public"."user_user_role_enum" NOT NULL DEFAULT 'client', "last_login" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "password" ADD CONSTRAINT "FK_4cd77c9b2e2522ee9d3671b3bc1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password" DROP CONSTRAINT "FK_4cd77c9b2e2522ee9d3671b3bc1"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_user_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_auth_method_enum"`);
        await queryRunner.query(`DROP TABLE "password"`);
    }

}
