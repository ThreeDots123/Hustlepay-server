import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  Min,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  IsObject,
  ValidateIf,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

@ValidatorConstraint({ name: "BudgetRangeValidator", async: false })
class BudgetRangeValidator implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    if (
      obj.budgetMin !== undefined &&
      obj.budgetMax !== undefined &&
      obj.budgetMin > obj.budgetMax
    ) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return "budgetMin should not be greater than budgetMax";
  }
}

export class CreateProposalDto {
  @ApiProperty({
    description: "Proposal title",
    example: "Web Development Project",
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Detailed proposal description",
    example: "Looking for an experienced web developer to build a modern e-commerce platform...",
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "Rich text description tree (optional)",
    example: {},
    required: false,
  })
  @IsObject()
  @IsOptional()
  @ValidateIf((object, value) => value !== null)
  descriptionTree?: Record<string, any>;

  @ApiProperty({
    description: "Array of category names or IDs",
    example: ["Web Development", "E-commerce"],
    type: [String],
    minItems: 1,
  })
  @IsArray()
  @ArrayNotEmpty()
  categories: string[]; // category names or ids

  @ApiProperty({
    description: "Minimum budget in Naira",
    example: 50000,
    minimum: 0,
    required: false,
  })
  @IsInt()
  @Min(0)
  budgetMin?: number;

  @ApiProperty({
    description: "Array of skill slugs or IDs",
    example: ["javascript", "react", "nodejs"],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  skills?: string[]; // skill slugs or ids

  @ApiProperty({
    description: "Maximum budget in Naira",
    example: 200000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMax?: number;

  @ApiProperty({
    description: "Estimated project duration in days",
    example: 30,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationEstimateDays?: number;

  @Validate(BudgetRangeValidator)
  checkBudgetRange: boolean;
}
