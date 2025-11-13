import { Exclude, Expose, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole, UserStatus } from "src/model/user.entity";

export class UserResponseDto {
  @ApiProperty({
    description: "firstname of the user",
    example: "john",
  })
  @Expose()
  firstname: string;

  @ApiProperty({
    description: "lastname of the user",
    example: "doe",
  })
  @Expose()
  lastname: string;

  @ApiProperty({
    description: "Email address of the user",
    example: "john.doe@example.com",
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: "User role in application.",
    enum: UserRole,
    example: UserRole.CLIENT,
  })
  @Expose()
  @Transform(({ value }) => value.toString())
  role: UserRole;

  @ApiProperty({
    description: "The current status of the user",
    enum: UserRole,
    example: UserRole.CLIENT,
  })
  @Expose()
  @Transform(({ value }) => value.toString())
  status: UserStatus;

  @ApiProperty({
    description: "Timestamp when the user was created",
    example: "2024-03-14T12:00:00Z",
  })
  @Expose()
  @Transform(({ value }) => new Date(value))
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp when the user was last updated",
    example: "2024-03-14T12:00:00Z",
  })
  @Expose()
  @Transform(({ value }) => new Date(value))
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
