import { Module, forwardRef } from "@nestjs/common";
import { MilestoneService } from "./milestone.service";
import { MilestoneController } from "./milestone.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Milestone } from "src/model/milestone.entity";
import { Contract } from "src/model/contract.entity";
import { Payment } from "src/model/payment.entity";
import { Wallet } from "src/model/wallet.entity";
import { UserModule } from "src/user/user.module";
import { CloudinaryModule } from "src/cloudinary/cloudinary.module";
import { TransactionModule } from "src/transaction/transaction.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Milestone, Contract, Payment, Wallet]),
    forwardRef(() => UserModule),
    CloudinaryModule,
    TransactionModule,
  ],
  providers: [MilestoneService],
  controllers: [MilestoneController],
  exports: [MilestoneService],
})
export class MilestoneModule {}
