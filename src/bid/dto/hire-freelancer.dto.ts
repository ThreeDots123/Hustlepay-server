import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class HireFreelancerDto {
  @ApiProperty({
    description: "Contract amount in Naira",
    example: 150000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: "Currency code (optional, defaults to NGN)",
    example: "NGN",
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
