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
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsObject()
  @IsOptional()
  @ValidateIf((object, value) => value !== null)
  descriptionTree?: Record<string, any>;
  @IsArray() @ArrayNotEmpty() categories: string[]; // category names or ids
  @IsInt() @Min(0) budgetMin?: number;
  @IsArray() @IsOptional() skills?: string[]; // skill slugs or ids
  @IsOptional() @IsInt() @Min(0) budgetMax?: number;
  @IsOptional() @IsInt() @Min(0) durationEstimateDays?: number;

  @Validate(BudgetRangeValidator)
  checkBudgetRange: boolean;
}
