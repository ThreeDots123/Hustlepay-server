import { forwardRef, Module } from "@nestjs/common";
import { BidService } from "./bid.service";
import { BidController, ClientBidsController } from "./bid.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Bid } from "src/model/bid.entity";
import { Proposal } from "src/model/proposal.entity";
import { User } from "src/model/user.entity";
import { Contract } from "src/model/contract.entity";
import { UserModule } from "src/user/user.module";
import { CloudinaryModule } from "src/cloudinary/cloudinary.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, Proposal, User, Contract]),
    forwardRef(() => UserModule),
    CloudinaryModule,
  ],
  providers: [BidService],
  controllers: [BidController, ClientBidsController],
  exports: [BidService],
})
export class BidModule {}
