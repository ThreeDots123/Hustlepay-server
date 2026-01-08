import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./user.service";
import { UsersController } from "./user.controller";
import { User } from "src/model/user.entity";
import { ProfileModule } from "src/profile/profile.module";
import { BidModule } from "src/bid/bid.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ProfileModule,
    forwardRef(() => BidModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UserModule {}
