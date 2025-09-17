import { Module } from "@nestjs/common";
import { PasswordService } from "./password.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Password } from "src/model/user-password.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Password])],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
