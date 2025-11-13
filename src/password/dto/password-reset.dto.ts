import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from "class-validator";

export class InitiatePasswordResetDto {
  @ApiProperty({
    description: "Email address of the user",
    example: "john.doe@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;
}

export class CompletePasswordResetDto {
  @ApiProperty({
    description: "Email address of the user",
    example: "john.doe@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description: "The 6-digit OTP code sent to email",
    example: "123456",
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: "OTP must be exactly 6 digits" })
  code: string;

  @ApiProperty({
    description:
      "New password (min 8 chars, must include uppercase, lowercase, and number)",
    example: "NewPassword123",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message:
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number",
  })
  newPassword: string;
}
