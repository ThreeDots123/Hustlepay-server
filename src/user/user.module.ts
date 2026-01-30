import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./user.service";
import { UsersController } from "./user.controller";
import { User } from "src/model/user.entity";
import { Wallet } from "src/model/wallet.entity";
import { ProfileModule } from "src/profile/profile.module";
import { BidModule } from "src/bid/bid.module";
import { ContractModule } from "src/contract/contract.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet]),
    ProfileModule,
    forwardRef(() => BidModule),
    forwardRef(() => ContractModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UserModule {}
