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
import { ProfileModule } from './profile/profile.module';
import { EventModule } from './event/event.module';
import { EmailModule } from './email/email.module';
import { TokenModule } from './token/token.module';
import { GigsModule } from './gigs/gigs.module';
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
    GigsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
