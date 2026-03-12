import { MigrationInterface, QueryRunner } from "typeorm";

export class FreelancerProofLink1772432804937 implements MigrationInterface {
    name = 'FreelancerProofLink1772432804937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "freelancer_proof_link" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" character varying NOT NULL, "label" character varying(100), "url" character varying(2048) NOT NULL, CONSTRAINT "PK_3dd000b1cbee95b4e7b6d000a08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "freelancer_proof_link" ADD CONSTRAINT "FK_45da73ec053fae0e83cfc6442d3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "freelancer_proof_link" DROP CONSTRAINT "FK_45da73ec053fae0e83cfc6442d3"`);
        await queryRunner.query(`DROP TABLE "freelancer_proof_link"`);
    }

}
