import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./user.service";
import { UsersController } from "./user.controller";
import { FreelancerProofLinkService } from "./freelancer-proof-link.service";
import { User } from "src/model/user.entity";
import { Wallet } from "src/model/wallet.entity";
import { FreelancerProofLink } from "src/model/freelancer-proof-link.entity";
import { ProfileModule } from "src/profile/profile.module";
import { BidModule } from "src/bid/bid.module";
import { ContractModule } from "src/contract/contract.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet, FreelancerProofLink]),
    ProfileModule,
    forwardRef(() => BidModule),
    forwardRef(() => ContractModule),
    forwardRef(() => AuthModule),
  ],
  providers: [UsersService, FreelancerProofLinkService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UserModule {}
