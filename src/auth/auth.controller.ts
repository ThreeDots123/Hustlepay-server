import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../user/dto/create-user-pswrd.dto";
import transformToAuthenticatedUser from "src/transformers/authenticated-user";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";
import { EmailService } from "src/email/email.service";
import { TokenService } from "src/token/token.service";
import { OtpPurpose } from "src/model/otp.entity";
import { JwtAuthGuard } from "./jwt.guard";
import { VerifyEmailTokenDto } from "src/token/dto/verify-token.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private usersService: UsersService,
    private emailService: EmailService,
    private tokenService: TokenService,
  ) {}

  @Post("verify/initiate")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async initiateEmailVerify(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;

    const user = await this.usersService.findSingleUser({ where: { id } });

    if (user.isVerified)
      throw new BadRequestException("Email is already verified");

    // Send OTP
    const otp = await this.tokenService.createOtp({
      userId: user.id,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      expiresInMinutes: 1,
      maxAttempts: 3,
    });
    await this.emailService.verifyEmail(
      {
        currentYear: new Date().getFullYear(),
        otpCode: otp.code,
      },
      user.email,
      "Verify your email",
    );

    return {
      message: "Verification email sent successfully",
    };
  }

  // VERIFY USER'S EMAIL[ACCOUNT]
  @Post("verify")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async verifyUserEmail(
    @Body() _body: VerifyEmailTokenDto,
    @Req() request: Request,
  ) {
    const { token } = _body;
    const { id } = request.user as AuthorisedRequest;

    const { isValid, message } = await this.tokenService.verifyOtp({
      userId: id,
      code: token,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
    });

    if (isValid) {
      // update user verified status
      await this.usersService.updateUser(id, { isVerified: true });
      return {
        message,
      };
    }

    throw new BadRequestException(message);
  }

  @Post("signup")
  async signup(@Body() _body: CreateUserDto) {
    if (!_body.password)
      throw new BadRequestException(["password is required"]);

    const result = await this.authService.signUp(_body);
    return {
      ...result,
      user: transformToAuthenticatedUser(result.user),
      event: "verify your account.",
    };
  }

  @Post("login")
  async login(@Body() _body: { email: string; password: string }) {
    return this.authService.login(_body.email, _body.password);
  }
}
