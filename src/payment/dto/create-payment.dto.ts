import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsEnum,
  ValidateIf,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum PaymentMode {
  FULL = "full",
  MILESTONE = "milestone",
}

export class InitiatePaymentDto {
  @ApiProperty({
    description: "Contract ID to initiate payment for",
    example: "ctrct_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @IsString()
  contractId: string;

  @ApiProperty({
    description: "Payment amount in smallest currency unit (kobo for NGN)",
    example: 150000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: "Currency code (optional, defaults to NGN)",
    example: "ngn",
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: "Payment mode: full upfront payment or milestone-based",
    enum: PaymentMode,
    example: PaymentMode.FULL,
  })
  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;

  @ApiProperty({
    description:
      "Milestone ID (required when paymentMode is MILESTONE). The milestone must exist and be in PENDING status.",
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    required: false,
  })
  @ValidateIf((o) => o.paymentMode === PaymentMode.MILESTONE)
  @IsString()
  milestoneId?: string;
}
