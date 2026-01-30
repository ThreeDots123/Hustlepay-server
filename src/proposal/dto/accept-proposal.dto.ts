import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AcceptProposalDto {
  @ApiProperty({
    description:
      "Contract amount in Naira (optional, defaults to proposal's budgetMin)",
    example: 150000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiProperty({
    description:
      "Currency code (optional, defaults to proposal's currency or NGN)",
    example: "NGN",
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
