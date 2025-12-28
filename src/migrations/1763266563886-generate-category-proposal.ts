import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateCategoryProposal1763266563886 implements MigrationInterface {
    name = 'GenerateCategoryProposal1763266563886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category_catalog" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, CONSTRAINT "UQ_9687e61514d9e09732a41a8ad64" UNIQUE ("name"), CONSTRAINT "PK_ddd03d18d0e3c52e5c7c6a19866" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "proposal_categories" ("proposalId" character varying NOT NULL, "categoryCatalogId" character varying NOT NULL, CONSTRAINT "PK_556c3767326e409076a75111896" PRIMARY KEY ("proposalId", "categoryCatalogId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d5747ab3d57614792dc9d6554d" ON "proposal_categories" ("proposalId") `);
        await queryRunner.query(`CREATE INDEX "IDX_59e6ecd80bac9f9467f2dc426c" ON "proposal_categories" ("categoryCatalogId") `);
        await queryRunner.query(`ALTER TABLE "proposal_categories" ADD CONSTRAINT "FK_d5747ab3d57614792dc9d6554da" FOREIGN KEY ("proposalId") REFERENCES "proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "proposal_categories" ADD CONSTRAINT "FK_59e6ecd80bac9f9467f2dc426c5" FOREIGN KEY ("categoryCatalogId") REFERENCES "category_catalog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposal_categories" DROP CONSTRAINT "FK_59e6ecd80bac9f9467f2dc426c5"`);
        await queryRunner.query(`ALTER TABLE "proposal_categories" DROP CONSTRAINT "FK_d5747ab3d57614792dc9d6554da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59e6ecd80bac9f9467f2dc426c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5747ab3d57614792dc9d6554d"`);
        await queryRunner.query(`DROP TABLE "proposal_categories"`);
        await queryRunner.query(`DROP TABLE "category_catalog"`);
    }

}
