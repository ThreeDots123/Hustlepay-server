import { Module } from "@nestjs/common";
import { ProposalService } from "./proposal.service";
import { ProposalController } from "./proposal.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "src/user/user.module";
import { SkillCatalog } from "src/model/skill-catalog.entity";
import { Proposal } from "src/model/proposal.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, SkillCatalog]), UserModule],
  providers: [ProposalService],
  controllers: [ProposalController],
  exports: [ProposalService],
})
export class ProposalModule {}
