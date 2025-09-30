import { EntityManager } from "typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EmailService } from "src/email/email.service";
import events from "src/event";
import { OtpPurpose } from "src/model/otp.entity";
import { TokenService } from "src/token/token.service";

export class UserCreatedEvent {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly userId: string,
    public readonly role: string,
  ) {}
}

const { created } = events.user;

@Injectable()
export class UserCreatedEventSubscriber {
  private readonly logger = new Logger(UserCreatedEventSubscriber.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    // private walletService: WalletService,
  ) {}

  @OnEvent(created)
  async handleUserCreatedEvent(data: {
    event: UserCreatedEvent;
    transactionalManager?: EntityManager;
  }) {
    const { event, transactionalManager } = data;
    try {
      this.logger.log(`User created: ${event.userId}`);

      // Create a wallet for user
      // await this.walletService.createWallet(
      //   { userId: event.userId },
      //   transactionalManager,
      // );

      const otp = await this.tokenService.createOtp({
        userId: event.userId,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
        expiresInMinutes: 1,
        maxAttempts: 3,
      });

      // Send welcome email to user
      return Promise.all([
        this.emailService.sendUserWelcomeEmail(
          event.name,
          event.email,
          "Welcome to Hustlepay - ",
          new Date().getFullYear(),
        ),
        this.emailService.verifyEmail(
          {
            currentYear: new Date().getFullYear(),
            otpCode: otp.code,
          },
          event.email,
          "Verify your email",
        ),
      ]);
    } catch (err) {
      throw new Error("Unable to send welcome email to user, " + event.userId);
    }
  }
}
