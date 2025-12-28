import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendFreelancerProfile1765919234063 implements MigrationInterface {
    name = 'ExtendFreelancerProfile1765919234063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "freelancer_work_experience" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "freelancer_profile_id" character varying NOT NULL, "job_title" character varying NOT NULL, "company" character varying NOT NULL, "duration" character varying, "description" text, CONSTRAINT "PK_688b1ef13591573fd2e42b26e17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "freelancer_portfolio" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "freelancer_profile_id" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "image_url" character varying, CONSTRAINT "PK_11913462ed19d5c3bf295d6104f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "freelancer_education" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "freelancer_profile_id" character varying NOT NULL, "degree" character varying NOT NULL, "school" character varying NOT NULL, "year" character varying, CONSTRAINT "PK_fe973f2189e7e9690657abe528b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "freelancer_language" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "freelancer_profile_id" character varying NOT NULL, "language" character varying NOT NULL, "proficiency" character varying NOT NULL, CONSTRAINT "PK_27fc8591cdc79d7c780b463db11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "freelancer_profile" ADD "location" character varying`);
        await queryRunner.query(`ALTER TABLE "freelancer_profile" ADD "profile_picture_url" character varying`);
        await queryRunner.query(`ALTER TABLE "freelancer_work_experience" ADD CONSTRAINT "FK_b3de2b12194ad4f2c19c09615db" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "freelancer_portfolio" ADD CONSTRAINT "FK_993c7dbd9ab1dea908e0395b4ef" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "freelancer_education" ADD CONSTRAINT "FK_444cc67534d6db5fe8f958af8f2" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "freelancer_language" ADD CONSTRAINT "FK_8ae482b67153bf3ca02e60fb793" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "freelancer_language" DROP CONSTRAINT "FK_8ae482b67153bf3ca02e60fb793"`);
        await queryRunner.query(`ALTER TABLE "freelancer_education" DROP CONSTRAINT "FK_444cc67534d6db5fe8f958af8f2"`);
        await queryRunner.query(`ALTER TABLE "freelancer_portfolio" DROP CONSTRAINT "FK_993c7dbd9ab1dea908e0395b4ef"`);
        await queryRunner.query(`ALTER TABLE "freelancer_work_experience" DROP CONSTRAINT "FK_b3de2b12194ad4f2c19c09615db"`);
        await queryRunner.query(`ALTER TABLE "freelancer_profile" DROP COLUMN "profile_picture_url"`);
        await queryRunner.query(`ALTER TABLE "freelancer_profile" DROP COLUMN "location"`);
        await queryRunner.query(`DROP TABLE "freelancer_language"`);
        await queryRunner.query(`DROP TABLE "freelancer_education"`);
        await queryRunner.query(`DROP TABLE "freelancer_portfolio"`);
        await queryRunner.query(`DROP TABLE "freelancer_work_experience"`);
    }

}
