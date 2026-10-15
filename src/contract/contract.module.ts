import { forwardRef, Module } from "@nestjs/common";
import { ContractService } from "./contract.service";
import { ContractController } from "./contract.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Contract } from "src/model/contract.entity";
import { Milestone } from "src/model/milestone.entity";
import { Payment } from "src/model/payment.entity";
import { Bid } from "src/model/bid.entity";
import { Proposal } from "src/model/proposal.entity";
import { UserModule } from "src/user/user.module";
import { Wallet } from "src/model/wallet.entity";
import { TransactionModule } from "src/transaction/transaction.module";
import { CloudinaryModule } from "src/cloudinary/cloudinary.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      Milestone,
      Payment,
      Bid,
      Proposal,
      Wallet,
      Payment,
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => TransactionModule),
    CloudinaryModule,
    forwardRef(() => AuthModule),
  ],
  providers: [ContractService],
  controllers: [ContractController],
  exports: [ContractService],
})
export class ContractModule {}
