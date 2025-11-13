import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { PasswordService } from "./password.service";
import {
  CompletePasswordResetDto,
  InitiatePasswordResetDto,
} from "./dto/password-reset.dto";

@Controller("password")
export class PasswordController {
  constructor(private passwordService: PasswordService) {}

  @Post("reset/initiate")
  @HttpCode(200)
  async initiatePasswordReset(@Body() _body: InitiatePasswordResetDto) {
    await this.passwordService.initiatePasswordReset(_body.email);

    return {
      success: true,
      message: "If this email exists, you will receive a password reset OTP.",
    };
  }

  @Post("reset/complete")
  @HttpCode(200)
  async completePasswordReset(@Body() _body: CompletePasswordResetDto) {
    await this.passwordService.completePasswordReset(_body);

    return {
      success: true,
      message: "Password reset successful",
    };
  }
}
