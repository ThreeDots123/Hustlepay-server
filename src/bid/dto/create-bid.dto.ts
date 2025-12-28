import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { BidRateType, BidExperienceLevel } from "src/model/bid.entity";

// This DTO is used after files are uploaded and converted to attachment metadata
export interface AttachmentMetadata {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "other";
  size: number;
  url: string;
}

export class CreateBidDto {
  @ApiProperty({
    description: "Bid title",
    example: "Professional Web Development Service",
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: "Cover letter explaining why you're the best fit",
    example:
      "I have extensive experience in web development with over 5 years of experience...",
    minLength: 50,
  })
  @IsString()
  @MinLength(50, { message: "Cover letter must be at least 50 characters" })
  coverLetter: string;

  @ApiProperty({
    description: "Proposed budget in Naira",
    example: 150000,
    minimum: 0,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  proposedBudget: number;

  @ApiProperty({
    description: "Rate type",
    enum: BidRateType,
    example: BidRateType.FIXED,
    required: false,
  })
  @IsEnum(BidRateType)
  @IsOptional()
  @Transform(({ value }) => value || BidRateType.FIXED)
  rateType?: BidRateType;

  @ApiProperty({
    description: "Proposed project duration in days",
    example: 21,
    minimum: 1,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  proposedDurationDays: number;

  @ApiProperty({
    description: "Experience level",
    enum: BidExperienceLevel,
    example: BidExperienceLevel.EXPERT,
    required: false,
  })
  @IsEnum(BidExperienceLevel)
  @IsOptional()
  experience?: BidExperienceLevel;

  @ApiProperty({
    description: "Portfolio URL",
    example: "https://portfolio.example.com",
    required: false,
  })
  @IsUrl()
  @IsOptional()
  portfolio?: string;

  // This will be populated after file uploads
  attachments?: AttachmentMetadata[];
}
