import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { PasswordService } from "./password.service";
import {
  CompletePasswordResetDto,
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
          example: "If this email exists, you will receive a password reset OTP.",
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
    description: "Validation error - Invalid OTP, expired OTP, or weak password",
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
}
