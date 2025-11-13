import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyEmailTokenDto {
  @ApiProperty({
    description: "The 6-digit OTP code sent to email",
    example: "123456",
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: "OTP must be exactly 6 digits" })
  token: string;
}
