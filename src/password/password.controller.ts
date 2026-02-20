import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { PasswordService } from "./password.service";
import {
  CompletePasswordResetDto,
  CompletePasswordResetWithTokenDto,
  InitiatePasswordResetDto,
} from "./dto/password-reset.dto";

@ApiTags("Password")
@Controller("password")
export class PasswordController {
  constructor(private passwordService: PasswordService) {}

  @Post("reset/initiate")
  @HttpCode(200)
  @ApiOperation({
    summary: "Initiate password reset",
    description:
      "Initiates a password reset process by sending a 6-digit OTP code to the user's email address. The response is the same whether the email exists or not (for security reasons).",
  })
  @ApiBody({
    type: InitiatePasswordResetDto,
    description: "Email address for password reset",
  })
  @ApiResponse({
    status: 200,
    description: "Password reset OTP sent (if email exists)",
    schema: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example:
            "If this email exists, you will receive a password reset OTP.",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation error - Invalid email format",
  })
  async initiatePasswordReset(@Body() _body: InitiatePasswordResetDto) {
    await this.passwordService.initiatePasswordReset(_body.email);

    return {
      success: true,
      message: "If this email exists, you will receive a password reset OTP.",
    };
  }

  @Post("reset/complete")
  @HttpCode(200)
  @ApiOperation({
    summary: "Complete password reset",
    description:
      "Completes the password reset process by verifying the OTP code and setting a new password.",
  })
  @ApiBody({
    type: CompletePasswordResetDto,
    description: "Password reset completion data",
  })
  @ApiResponse({
    status: 200,
    description: "Password reset successful",
    schema: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example: "Password reset successful",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Validation error - Invalid OTP, expired OTP, or weak password",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async completePasswordReset(@Body() _body: CompletePasswordResetDto) {
    await this.passwordService.completePasswordReset(_body);

    return {
      success: true,
      message: "Password reset successful",
    };
  }

  @Get("reset/validate")
  @ApiOperation({
    summary: "Validate reset token",
    description:
      "Checks if the token from the reset link is valid and not expired.",
  })
  @ApiQuery({
    name: "token",
    required: true,
    description: "Reset token from the password reset URL",
  })
  @ApiResponse({
    status: 200,
    description: "Token validation result",
    schema: {
      type: "object",
      properties: {
        valid: { type: "boolean" },
      },
    },
  })
  async validateResetToken(@Query("token") token: string) {
    const result = await this.passwordService.validateResetToken(token);
    return result;
  }

  @Post("reset/complete-with-token")
  @HttpCode(200)
  @ApiOperation({
    summary: "Complete password reset with token",
    description:
      "Completes the password reset using the token from the reset link.",
  })
  @ApiBody({ type: CompletePasswordResetWithTokenDto })
  @ApiResponse({
    status: 200,
    description: "Password reset successful",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "Password reset successful" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid or expired token",
  })
  async completePasswordResetWithToken(
    @Body() body: CompletePasswordResetWithTokenDto,
  ) {
    await this.passwordService.completePasswordResetWithToken(
      body.token,
      body.newPassword,
    );
    return {
      success: true,
      message: "Password reset successful",
    };
  }
}
