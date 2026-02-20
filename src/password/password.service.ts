import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import BaseService from "src/interface/service/base.service";
import { CreateUserDto } from "src/user/dto/create-user-pswrd.dto";
import { Password as PasswordEntity } from "src/model/user-password.entity";
import { UsersService } from "src/user/user.service";
import { TokenService } from "src/token/token.service";
import { OtpPurpose } from "src/model/otp.entity";
import { EmailService } from "src/email/email.service";
import { ConfigService } from "@nestjs/config";
import { FRONTEND_URL } from "src/config/env";

const PASSWORD_RESET_EXPIRY_MINUTES = 5;

@Injectable()
export class PasswordService extends BaseService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    @InjectRepository(PasswordEntity)
    private passwordRepository: Repository<PasswordEntity>,
    private usersService: UsersService,
    private tokenService: TokenService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    super();
  }
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(unHashedPsw: string, hashedPsw: string) {
    return bcrypt.compare(unHashedPsw, hashedPsw);
  }

  async createPasswordForUser(
    password: string,
    user: Omit<CreateUserDto, "password">,
    transactionalEntity?: EntityManager,
  ) {
    const passwordInstance = this.passwordRepository.create({
      key: password,
      user,
    });
    const newPassword = await this.performEntityOps<
      PasswordEntity,
      PasswordEntity
    >({
      repositoryManager: this.passwordRepository,
      transactionalEntity,
      action: "save",
      opsArgs: [passwordInstance],
    });

    return newPassword;
  }

  async initiatePasswordReset(email: string) {
    const user = await this.usersService.findSingleUser({
      where: { email },
    });

    if (user) {
      const otp = await this.tokenService.createOtp({
        userId: user.id,
        purpose: OtpPurpose.PASSWORD_RESET,
        expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
        withResetToken: true,
      });

      const baseUrl =
        this.configService.get<string>(FRONTEND_URL) || "http://localhost:3000";
      const resetUrl = `${baseUrl}/account/reset-password?token=${encodeURIComponent(otp.token!)}`;
      this.logger.log(
        `[Password Reset] Reset URL for ${email} (valid ${PASSWORD_RESET_EXPIRY_MINUTES} min): ${resetUrl}`,
      );

      // await this.emailService.sendPasswordReset(
      //   { fullName: user.firstname, otpCode: otp.code },
      //   user.email,
      //   "Password Reset Request",
      // );
    }
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const otp = await this.tokenService.findPasswordResetByToken(token);
    return { valid: !!otp };
  }

  async completePasswordResetWithToken(token: string, newPassword: string) {
    const otp = await this.tokenService.findPasswordResetByToken(token);
    if (!otp) {
      throw new BadRequestException("Invalid or expired reset link.");
    }

    const hashedPw = await this.hashPassword(newPassword);
    await this.passwordRepository.update(
      { userId: otp.userId },
      { key: hashedPw },
    );

    await this.tokenService.markOtpUsed(otp);
  }

  async completePasswordReset(data: {
    email: string;
    code: string;
    newPassword: string;
  }) {
    const user = await this.usersService.findSingleUser({
      where: { email: data.email },
    });

    if (!user) {
      throw new BadRequestException("Invalid reset attempt");
    }

    const { isValid, message } = await this.tokenService.verifyOtp({
      userId: user.id,
      code: data.code,
      purpose: OtpPurpose.PASSWORD_RESET,
    });

    if (!isValid) throw new BadRequestException(message);
    // Hash user password
    const hashedPw = await this.hashPassword(data.newPassword);

    await this.passwordRepository.update(
      { userId: user.id },
      { key: hashedPw },
    );
  }
}
