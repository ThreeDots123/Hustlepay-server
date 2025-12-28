import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LoggerMiddleware } from "./middleware/request-logger.middleware";
import databaseConfig from "./config/database.config";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { PasswordModule } from "./password/password.module";
import { ProfileModule } from "./profile/profile.module";
import { EventModule } from "./event/event.module";
import { EmailModule } from "./email/email.module";
import { TokenModule } from "./token/token.module";
import { ProposalModule } from "./proposal/proposal.module";
import { BidModule } from "./bid/bid.module";
import { ContractModule } from './contract/contract.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    PasswordModule,
    ProfileModule,
    EventModule,
    EmailModule,
    TokenModule,
    ProposalModule,
    BidModule,
    ContractModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
