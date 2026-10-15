import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ProofLinkItemDto {
  @ApiPropertyOptional({ example: "Portfolio" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiProperty({ example: "https://myportfolio.com" })
  @IsString()
  @IsUrl({ protocols: ["http", "https"] })
  url: string;
}

export class SubmitActivationProofLinksDto {
  @ApiProperty({ type: [ProofLinkItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProofLinkItemDto)
  links: ProofLinkItemDto[];
}
