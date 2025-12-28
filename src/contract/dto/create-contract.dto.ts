import { IsString, IsUUID, IsInt, Min, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateContractDto {
  @ApiProperty({
    description: "Bid ID to create contract from",
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @IsUUID()
  bidId: string;

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
