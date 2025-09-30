import { Module } from "@nestjs/common";
import { TokenService } from "./token.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Otp } from "src/model/otp.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
