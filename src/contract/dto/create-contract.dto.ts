import { IsString, IsUUID, IsInt, Min, IsOptional } from "class-validator";

export class CreateContractDto {
  @IsUUID() bidId: string;
  @IsInt() @Min(0) amount: number;
  @IsOptional() @IsString() currency?: string;
}
