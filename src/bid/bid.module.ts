import { Module } from "@nestjs/common";
import { BidService } from "./bid.service";
import { BidController } from "./bid.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Bid } from "src/model/bid.entity";
import { Proposal } from "src/model/proposal.entity";
import { User } from "src/model/user.entity";
import { UserModule } from "src/user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([Bid, Proposal, User]), UserModule],
  providers: [BidService],
  controllers: [BidController],
})
export class BidModule {}
