import { Module } from "@nestjs/common";
import { ContractService } from "./contract.service";
import { ContractController } from "./contract.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Contract } from "src/model/contract.entity";
import { Milestone } from "src/model/milestone.entity";
import { Payment } from "src/model/payment.entity";
import { Bid } from "src/model/bid.entity";
import { Proposal } from "src/model/proposal.entity";
import { UserModule } from "src/user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Milestone, Payment, Bid, Proposal]),
    UserModule,
  ],
  providers: [ContractService],
  controllers: [ContractController],
})
export class ContractModule {}
