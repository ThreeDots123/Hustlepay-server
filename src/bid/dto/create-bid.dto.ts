import { IsString, IsOptional, IsInt, Min } from "class-validator";
export class CreateBidDto {
  @IsString() coverLetter: string;
  @IsOptional() @IsInt() @Min(0) proposedBudget?: number;
  @IsOptional() @IsInt() @Min(0) proposedDurationDays?: number;
}
