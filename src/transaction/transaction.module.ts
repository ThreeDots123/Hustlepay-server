import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "src/model/transaction.entity";
import { UserModule } from "src/user/user.module";
import { TransactionService } from "./transaction.service";
import { TransactionController } from "./transaction.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    forwardRef(() => UserModule),
  ],
  providers: [TransactionService],
  controllers: [TransactionController],
  exports: [TransactionService, TypeOrmModule],
})
export class TransactionModule {}
