import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsDateString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMilestoneDto {
  @ApiProperty({
    description: "Contract ID to create milestone for",
    example: "ctrct_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @IsString()
  contractId: string;

  @ApiProperty({
    description:
      "Parent milestone ID (optional). If not provided, creates a parent milestone. If provided, creates a child milestone.",
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description: "Milestone title",
    example: "Design Phase Completion",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Milestone description (optional)",
    example: "Complete all design mockups and get client approval",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Milestone amount in smallest currency unit (kobo for NGN)",
    example: 50000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: "Due date for the milestone (optional)",
    example: "2024-12-31T23:59:59Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
