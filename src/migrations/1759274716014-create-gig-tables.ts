import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGigTables1759274716014 implements MigrationInterface {
    name = 'CreateGigTables1759274716014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."gig_media_type_enum" AS ENUM('image', 'video')`);
        await queryRunner.query(`CREATE TABLE "gig_media" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "gig_package_id" character varying NOT NULL, "type" "public"."gig_media_type_enum" NOT NULL DEFAULT 'image', "url" character varying(500) NOT NULL, "alt_text" character varying(255), CONSTRAINT "PK_c13074e2a1c5b6d3334dbfff5bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."gig_package_type_enum" AS ENUM('basic', 'standard', 'premium')`);
        await queryRunner.query(`CREATE TABLE "gig_package" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "type" "public"."gig_package_type_enum" NOT NULL, "name" character varying(255) NOT NULL, "description" text NOT NULL, "gig_id" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "delivery_days" integer NOT NULL, "revisions" integer, "features" text, CONSTRAINT "PK_d3a1ab75556daa4ec0d7085efd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "gig" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying(255) NOT NULL, "description" text NOT NULL, "freelancer_id" character varying NOT NULL, "category" character varying(255) NOT NULL, "tags" text, CONSTRAINT "PK_18bb613fc8f2dba24c9e701f91b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "gig_media" ADD CONSTRAINT "FK_238fc6565ea6e402e3ab4fc2215" FOREIGN KEY ("gig_package_id") REFERENCES "gig_package"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gig_package" ADD CONSTRAINT "FK_f7cf87452efde8bd45b428a8dcd" FOREIGN KEY ("gig_id") REFERENCES "gig"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gig" ADD CONSTRAINT "FK_a1545bb8a7ea76e67e1da26463e" FOREIGN KEY ("freelancer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gig" DROP CONSTRAINT "FK_a1545bb8a7ea76e67e1da26463e"`);
        await queryRunner.query(`ALTER TABLE "gig_package" DROP CONSTRAINT "FK_f7cf87452efde8bd45b428a8dcd"`);
        await queryRunner.query(`ALTER TABLE "gig_media" DROP CONSTRAINT "FK_238fc6565ea6e402e3ab4fc2215"`);
        await queryRunner.query(`DROP TABLE "gig"`);
        await queryRunner.query(`DROP TABLE "gig_package"`);
        await queryRunner.query(`DROP TYPE "public"."gig_package_type_enum"`);
        await queryRunner.query(`DROP TABLE "gig_media"`);
        await queryRunner.query(`DROP TYPE "public"."gig_media_type_enum"`);
    }

}
