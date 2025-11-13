import { Exclude, Expose, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class ClientProfileDto {
  @ApiProperty({
    description: "The company the user belongs to",
    example: "company x",
  })
  @Expose()
  companyName: string;

  @ApiProperty({
    description: "The user's phone numbwe",
    example: "091234567890",
  })
  @Expose()
  phoneNumber: string;

  @ApiProperty({
    description: "The user's country",
    example: "NGN",
  })
  @Expose()
  country: string;

  @ApiProperty({
    description: "The industry they belong to",
    example: "industry",
  })
  @Expose()
  industry: string;

  @Exclude()
  deletedAt: Date;

  constructor(partial: Partial<ClientProfileDto>) {
    Object.assign(this, partial);
  }
}
