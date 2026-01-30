import { Module, forwardRef } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { PaystackService } from "./paystack.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "src/model/payment.entity";
import { Contract } from "src/model/contract.entity";
import { Milestone } from "src/model/milestone.entity";
import { UserModule } from "src/user/user.module";
import { ContractModule } from "src/contract/contract.module";
import { TransactionModule } from "src/transaction/transaction.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Contract, Milestone]),
    forwardRef(() => UserModule),
    forwardRef(() => ContractModule),
    TransactionModule,
  ],
  providers: [PaymentService, PaystackService],
  controllers: [PaymentController],
  exports: [PaymentService, PaystackService],
})
export class PaymentModule {}
