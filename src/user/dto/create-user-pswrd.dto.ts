import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";
import { Expose, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "src/model/user.entity";

export class CreateUserDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Transform(({ value }) => value?.trim().toLowerCase())
  @ApiProperty({
    description: "User's firstname",
    example: "John",
    minLength: 3,
  })
  firstname: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Transform(({ value }) => value?.trim().toLowerCase())
  @ApiProperty({
    description: "User's lastname",
    example: "Doe",
    minLength: 3,
  })
  lastname: string;

  @Expose()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @ApiProperty({
    description: "Email address of the user",
    example: "john.doe@example.com",
  })
  email: string;

  @Expose()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @ApiProperty({
    description: "The role of the user",
    example: "freelancer",
  })
  role: UserRole;

  @Expose()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message:
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number",
  })
  @ApiProperty({
    description:
      "User password (min 6 chars, must include uppercase, lowercase, and number)",
    example: "Password123",
    minLength: 8,
    required: false,
  })
  password: string;
}
