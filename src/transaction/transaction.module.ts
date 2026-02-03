import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "src/model/transaction.entity";
import { UserModule } from "src/user/user.module";
import { TransactionService } from "./transaction.service";
import { TransactionController } from "./transaction.controller";
import { Wallet } from "src/model/wallet.entity";
import { Payment } from "src/model/payment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Wallet, Payment]),
    forwardRef(() => UserModule),
  ],
  providers: [TransactionService],
  controllers: [TransactionController],
  exports: [TransactionService, TypeOrmModule],
})
export class TransactionModule {}
