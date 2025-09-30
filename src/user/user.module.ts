import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./user.service";
import { UsersController } from "./user.controller";
import { User } from "src/model/user.entity";
import { ProfileModule } from "src/profile/profile.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), ProfileModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UserModule {}
