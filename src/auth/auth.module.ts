import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersService } from "src/user/user.service";
import { JwtStrategy } from "./jwt.strategy";
import { JWT_SECRET } from "src/config/env";
import { User } from "src/model/user.entity";
import { PasswordModule } from "src/password/password.module";
import { ProfileModule } from "src/profile/profile.module";
import { TokenModule } from "src/token/token.module";
import { EmailModule } from "src/email/email.module";
import { Wallet } from "src/model/wallet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet]),
    PassportModule,
    PasswordModule,
    ProfileModule,
    TokenModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(JWT_SECRET),
        signOptions: { expiresIn: "30d" },
      }),
    }),
  ],
  providers: [AuthService, UsersService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
