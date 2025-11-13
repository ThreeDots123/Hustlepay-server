import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProposalRelatedTables1762354881426 implements MigrationInterface {
    name = 'CreateProposalRelatedTables1762354881426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bid_user_status_enum" AS ENUM('pending', 'withdrawn', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "bid" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "freelancer_id" character varying NOT NULL, "proposal_id" character varying NOT NULL, "coverLetter" text NOT NULL, "proposedBudget" integer, "proposedDurationDays" integer, "user_status" "public"."bid_user_status_enum" NOT NULL DEFAULT 'pending', "messageCount" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_ed405dda320051aca2dcb1a50bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f659d2b22416978881d096185a" ON "bid" ("messageCount") `);
        await queryRunner.query(`CREATE TABLE "freelancer_profile" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "display_name" character varying, "bio" text, "hourly_rate" numeric, "experience_level" character varying, "user_id" character varying NOT NULL, CONSTRAINT "REL_46f3e11a9225cdaa32a847f74a" UNIQUE ("user_id"), CONSTRAINT "PK_02075bf38ed605f3a7d7a2267d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "skill_catalog" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "category" character varying, CONSTRAINT "UQ_a3220e16d12a47b43fb2e2e6404" UNIQUE ("name"), CONSTRAINT "PK_1a2e155daca1357d313d5bf27d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."proposal_user_status_enum" AS ENUM('open', 'closed', 'cancelled', 'hired')`);
        await queryRunner.query(`CREATE TABLE "proposal" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying(255) NOT NULL, "description" text NOT NULL, "client_id" character varying NOT NULL, "budgetMin" integer, "budgetMax" integer, "currency" character varying(10) NOT NULL DEFAULT 'ngn', "durationEstimateDays" integer, "user_status" "public"."proposal_user_status_enum" NOT NULL DEFAULT 'open', "inviteOnly" boolean NOT NULL DEFAULT false, "coverImageUrl" character varying, "viewCount" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_ca872ecfe4fef5720d2d39e4275" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b9413bdd795863645fe2f9f8d1" ON "proposal" ("viewCount") `);
        await queryRunner.query(`CREATE TYPE "public"."milestone_user_status_enum" AS ENUM('pending', 'submitted', 'approved', 'released', 'disputed')`);
        await queryRunner.query(`CREATE TABLE "milestone" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "contract_id" character varying NOT NULL, "title" character varying(255) NOT NULL, "description" text, "amount" integer NOT NULL, "user_status" "public"."milestone_user_status_enum" NOT NULL DEFAULT 'pending', "dueDate" TIMESTAMP, CONSTRAINT "PK_f8372abce331f60ba7b33fe23a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_user_status_enum" AS ENUM('pending', 'success', 'failed', 'escrowed', 'refunded', 'disputed')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" character varying NOT NULL, "amount" integer NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'ngn', "user_status" "public"."payments_user_status_enum" NOT NULL DEFAULT 'pending', "providerPaymentId" character varying(255), "providerRaw" jsonb, "payerId" character varying NOT NULL, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_50d2f08323fc3531369f2f4184" ON "payments" ("providerPaymentId") `);
        await queryRunner.query(`CREATE TYPE "public"."contract_user_status_enum" AS ENUM('awaiting_payment', 'active', 'completed', 'cancelled', 'disputed')`);
        await queryRunner.query(`CREATE TABLE "contract" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "proposal_id" character varying, "client_id" character varying NOT NULL, "freelancer_id" character varying NOT NULL, "amount" integer NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'ngn', "user_status" "public"."contract_user_status_enum" NOT NULL DEFAULT 'awaiting_payment', CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "sender_id" character varying NOT NULL, "proposal_id" character varying, "contract_id" character varying, "body" text NOT NULL, "attachmentUrl" character varying, "isRead" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_055e85cd63dcd4dc5922504a3a" ON "message" ("isRead") `);
        await queryRunner.query(`CREATE TYPE "public"."otp_purpose_enum" AS ENUM('email_verification', 'password_reset', 'passwordless_login')`);
        await queryRunner.query(`CREATE TABLE "otp" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" character varying NOT NULL, "code" character varying NOT NULL, "purpose" "public"."otp_purpose_enum" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used" boolean NOT NULL DEFAULT false, "attempts" integer NOT NULL DEFAULT '0', "max_attempts" integer NOT NULL DEFAULT '3', CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "client_profile" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "company_name" character varying, "phone_number" character varying, "country" character varying DEFAULT 'NGN', "industry" character varying, "user_id" character varying NOT NULL, CONSTRAINT "REL_26a858e080153997228921c5af" UNIQUE ("user_id"), CONSTRAINT "PK_c83cb406437edcd525bfd139439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "freelancer_skills" ("freelancerProfileId" character varying NOT NULL, "skillCatalogId" character varying NOT NULL, CONSTRAINT "PK_4b32b508c4b78651abcc4e7f2fb" PRIMARY KEY ("freelancerProfileId", "skillCatalogId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1a801db73f0a60bece6eb16403" ON "freelancer_skills" ("freelancerProfileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d3a7b65fc37c3b5040c6d9216d" ON "freelancer_skills" ("skillCatalogId") `);
        await queryRunner.query(`CREATE TABLE "proposal_skills" ("proposalId" character varying NOT NULL, "skillCatalogId" character varying NOT NULL, CONSTRAINT "PK_78fd4e35a4614f68bff9742a5e5" PRIMARY KEY ("proposalId", "skillCatalogId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_71f3c0ba79da0dc0181513cfc8" ON "proposal_skills" ("proposalId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8666cdc6389e40ff7b9127d44c" ON "proposal_skills" ("skillCatalogId") `);
        await queryRunner.query(`CREATE TYPE "public"."user_user_status_enum" AS ENUM('active', 'suspended', 'pending')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "user_status" "public"."user_user_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "is_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "bid" ADD CONSTRAINT "FK_1d2d1500e276902ceeedf16d2e9" FOREIGN KEY ("freelancer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bid" ADD CONSTRAINT "FK_7b31c43b94d21754a6582022059" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "freelancer_profile" ADD CONSTRAINT "FK_46f3e11a9225cdaa32a847f74a4" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposal" ADD CONSTRAINT "FK_d2461699147a84d8d6274cfaebf" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD CONSTRAINT "FK_4c0f223580d5fc315a2d5a62099" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_52fc2356fb8c211c93d4b1496f3" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_ff40a657baa9226eb63c6c01dd3" FOREIGN KEY ("payerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract" ADD CONSTRAINT "FK_6e81a294eb4984da3bf29dbe4c7" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract" ADD CONSTRAINT "FK_17598b1610ffe62285e28e8679c" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract" ADD CONSTRAINT "FK_a1dc16d1fc284cd6a6e83ed3dcf" FOREIGN KEY ("freelancer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_c0ab99d9dfc61172871277b52f6" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_aebc4530cfc021bfb38d35b7a9c" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_1f6b6bcf09320f6d8a3a1fc437f" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "otp" ADD CONSTRAINT "FK_258d028d322ea3b856bf9f12f25" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_profile" ADD CONSTRAINT "FK_26a858e080153997228921c5afa" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "freelancer_skills" ADD CONSTRAINT "FK_1a801db73f0a60bece6eb164035" FOREIGN KEY ("freelancerProfileId") REFERENCES "freelancer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "freelancer_skills" ADD CONSTRAINT "FK_d3a7b65fc37c3b5040c6d9216d8" FOREIGN KEY ("skillCatalogId") REFERENCES "skill_catalog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposal_skills" ADD CONSTRAINT "FK_71f3c0ba79da0dc0181513cfc8d" FOREIGN KEY ("proposalId") REFERENCES "proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "proposal_skills" ADD CONSTRAINT "FK_8666cdc6389e40ff7b9127d44c9" FOREIGN KEY ("skillCatalogId") REFERENCES "skill_catalog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposal_skills" DROP CONSTRAINT "FK_8666cdc6389e40ff7b9127d44c9"`);
        await queryRunner.query(`ALTER TABLE "proposal_skills" DROP CONSTRAINT "FK_71f3c0ba79da0dc0181513cfc8d"`);
        await queryRunner.query(`ALTER TABLE "freelancer_skills" DROP CONSTRAINT "FK_d3a7b65fc37c3b5040c6d9216d8"`);
        await queryRunner.query(`ALTER TABLE "freelancer_skills" DROP CONSTRAINT "FK_1a801db73f0a60bece6eb164035"`);
        await queryRunner.query(`ALTER TABLE "client_profile" DROP CONSTRAINT "FK_26a858e080153997228921c5afa"`);
        await queryRunner.query(`ALTER TABLE "otp" DROP CONSTRAINT "FK_258d028d322ea3b856bf9f12f25"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_1f6b6bcf09320f6d8a3a1fc437f"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_aebc4530cfc021bfb38d35b7a9c"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_c0ab99d9dfc61172871277b52f6"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP CONSTRAINT "FK_a1dc16d1fc284cd6a6e83ed3dcf"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP CONSTRAINT "FK_17598b1610ffe62285e28e8679c"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP CONSTRAINT "FK_6e81a294eb4984da3bf29dbe4c7"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_ff40a657baa9226eb63c6c01dd3"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_52fc2356fb8c211c93d4b1496f3"`);
        await queryRunner.query(`ALTER TABLE "milestone" DROP CONSTRAINT "FK_4c0f223580d5fc315a2d5a62099"`);
        await queryRunner.query(`ALTER TABLE "proposal" DROP CONSTRAINT "FK_d2461699147a84d8d6274cfaebf"`);
        await queryRunner.query(`ALTER TABLE "freelancer_profile" DROP CONSTRAINT "FK_46f3e11a9225cdaa32a847f74a4"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP CONSTRAINT "FK_7b31c43b94d21754a6582022059"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP CONSTRAINT "FK_1d2d1500e276902ceeedf16d2e9"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_verified"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "user_status"`);
        await queryRunner.query(`DROP TYPE "public"."user_user_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8666cdc6389e40ff7b9127d44c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71f3c0ba79da0dc0181513cfc8"`);
        await queryRunner.query(`DROP TABLE "proposal_skills"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3a7b65fc37c3b5040c6d9216d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a801db73f0a60bece6eb16403"`);
        await queryRunner.query(`DROP TABLE "freelancer_skills"`);
        await queryRunner.query(`DROP TABLE "client_profile"`);
        await queryRunner.query(`DROP TABLE "otp"`);
        await queryRunner.query(`DROP TYPE "public"."otp_purpose_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_055e85cd63dcd4dc5922504a3a"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "contract"`);
        await queryRunner.query(`DROP TYPE "public"."contract_user_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_50d2f08323fc3531369f2f4184"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_user_status_enum"`);
        await queryRunner.query(`DROP TABLE "milestone"`);
        await queryRunner.query(`DROP TYPE "public"."milestone_user_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9413bdd795863645fe2f9f8d1"`);
        await queryRunner.query(`DROP TABLE "proposal"`);
        await queryRunner.query(`DROP TYPE "public"."proposal_user_status_enum"`);
        await queryRunner.query(`DROP TABLE "skill_catalog"`);
        await queryRunner.query(`DROP TABLE "freelancer_profile"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f659d2b22416978881d096185a"`);
        await queryRunner.query(`DROP TABLE "bid"`);
        await queryRunner.query(`DROP TYPE "public"."bid_user_status_enum"`);
    }

}
