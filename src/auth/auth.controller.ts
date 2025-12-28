import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../user/dto/create-user-pswrd.dto";
import transformToAuthenticatedUser from "src/transformers/authenticated-user";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";
import { EmailService } from "src/email/email.service";
import { TokenService } from "src/token/token.service";
import { OtpPurpose } from "src/model/otp.entity";
import { JwtAuthGuard } from "./guards/jwt.guard";
import { VerifyEmailTokenDto } from "src/token/dto/verify-token.dto";

@ApiTags("Authentication")
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Initiate email verification",
    description:
      "Sends a 6-digit OTP code to the user's email address for email verification. The user must be authenticated and not already verified.",
  })
  @ApiResponse({
    status: 200,
    description: "Verification email sent successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Verification email sent successfully",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Email is already verified",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Verify user email",
    description:
      "Verifies the user's email address using the 6-digit OTP code sent to their email. The user must be authenticated.",
  })
  @ApiBody({
    type: VerifyEmailTokenDto,
    description: "OTP token for email verification",
  })
  @ApiResponse({
    status: 200,
    description: "Email verified successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Email verified successfully",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid or expired OTP token",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
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
  @ApiOperation({
    summary: "User registration",
    description:
      "Creates a new user account. Supports both client and freelancer roles. Password is optional but recommended for immediate account access.",
  })
  @ApiBody({
    type: CreateUserDto,
    description: "User registration data",
  })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
    schema: {
      type: "object",
      properties: {
        accessToken: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", example: "john.doe@example.com" },
            firstname: { type: "string", example: "John" },
            lastname: { type: "string", example: "Doe" },
            role: { type: "string", example: "freelancer" },
            isVerified: { type: "boolean", example: false },
          },
        },
        event: {
          type: "string",
          example: "verify your account.",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation error or user already exists",
  })
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
  @HttpCode(200)
  @ApiOperation({
    summary: "User login",
    description:
      "Authenticates a user with email and password. Returns a JWT access token and user information.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: {
          type: "string",
          format: "email",
          example: "john.doe@example.com",
          description: "User's email address",
        },
        password: {
          type: "string",
          example: "Password123",
          description: "User's password",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    schema: {
      type: "object",
      properties: {
        accessToken: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", example: "john.doe@example.com" },
            firstname: { type: "string", example: "John" },
            lastname: { type: "string", example: "Doe" },
            role: { type: "string", example: "freelancer" },
            isVerified: { type: "boolean", example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid email or password",
  })
  async login(@Body() _body: { email: string; password: string }) {
    const result = await this.authService.login(_body.email, _body.password);
    return {
      ...result,
      user: transformToAuthenticatedUser(result.user),
    };
  }
}
