import { forwardRef, Module } from "@nestjs/common";
import { PasswordService } from "./password.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Password } from "src/model/user-password.entity";
import { PasswordController } from "./password.controller";
import { EmailModule } from "src/email/email.module";
import { UserModule } from "src/user/user.module";
import { TokenModule } from "src/token/token.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Password]),
    EmailModule,
    forwardRef(() => UserModule),
    TokenModule,
  ],
  providers: [PasswordService],
  exports: [PasswordService],
  controllers: [PasswordController],
})
export class PasswordModule {}
