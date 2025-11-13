import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProfilesAndSkills1758102104093 implements MigrationInterface {
    name = 'CreateProfilesAndSkills1758102104093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "skill_catalog" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "category" character varying, CONSTRAINT "UQ_a3220e16d12a47b43fb2e2e6404" UNIQUE ("name"), CONSTRAINT "PK_1a2e155daca1357d313d5bf27d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "freelancer_profile" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "display_name" character varying, "bio" text, "hourly_rate" numeric, "experience_level" character varying, "user_id" character varying NOT NULL, CONSTRAINT "REL_46f3e11a9225cdaa32a847f74a" UNIQUE ("user_id"), CONSTRAINT "PK_02075bf38ed605f3a7d7a2267d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "skill" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "freelancer_profile_id" character varying, "catalog_id" character varying, CONSTRAINT "PK_a0d33334424e64fb78dc3ce7196" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "client_profile" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "company_name" character varying, "phone_number" character varying, "country" character varying, "industry" character varying, "user_id" character varying NOT NULL, CONSTRAINT "REL_26a858e080153997228921c5af" UNIQUE ("user_id"), CONSTRAINT "PK_c83cb406437edcd525bfd139439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_user_status_enum" AS ENUM('active', 'suspended', 'pending')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "user_status" "public"."user_user_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "freelancer_profile" ADD CONSTRAINT "FK_46f3e11a9225cdaa32a847f74a4" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "skill" ADD CONSTRAINT "FK_32720532260654e3dede26832fc" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "skill" ADD CONSTRAINT "FK_1a2e155daca1357d313d5bf27d5" FOREIGN KEY ("catalog_id") REFERENCES "skill_catalog"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_profile" ADD CONSTRAINT "FK_26a858e080153997228921c5afa" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_profile" DROP CONSTRAINT "FK_26a858e080153997228921c5afa"`);
        await queryRunner.query(`ALTER TABLE "skill" DROP CONSTRAINT "FK_1a2e155daca1357d313d5bf27d5"`);
        await queryRunner.query(`ALTER TABLE "skill" DROP CONSTRAINT "FK_32720532260654e3dede26832fc"`);
        await queryRunner.query(`ALTER TABLE "freelancer_profile" DROP CONSTRAINT "FK_46f3e11a9225cdaa32a847f74a4"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "user_status"`);
        await queryRunner.query(`DROP TYPE "public"."user_user_status_enum"`);
        await queryRunner.query(`DROP TABLE "client_profile"`);
        await queryRunner.query(`DROP TABLE "skill"`);
        await queryRunner.query(`DROP TABLE "freelancer_profile"`);
        await queryRunner.query(`DROP TABLE "skill_catalog"`);
    }

}
