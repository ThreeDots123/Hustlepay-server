import { IsString, IsInt, Min, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDeliverableDto {
  @ApiProperty({
    description: "Contract ID (required if milestoneId is not provided)",
    example: "ctrct_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    required: false,
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiProperty({
    description: "Milestone ID (required if contractId is not provided)",
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    required: false,
  })
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @ApiProperty({
    description: "Deliverable title",
    example: "Complete design mockups",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Deliverable description (optional)",
    example: "Create high-fidelity mockups for all pages",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Order/sequence number for sorting deliverables",
    example: 1,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

