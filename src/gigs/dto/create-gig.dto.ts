import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  IsEnum,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PackageType } from "src/model/gig-package.entity";
import { MediaType } from "src/model/gig-media.entity";

// --------------------
// Media DTO
// --------------------
export class CreateGigMediaDto {
  @IsEnum(MediaType)
  type: MediaType;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  alt_text?: string;
}

// --------------------
// Package DTO
// --------------------
export class CreateGigPackageDto {
  @IsEnum(PackageType)
  type: PackageType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(1)
  price: number;

  @IsNumber()
  @Min(1)
  deliveryDays: number;

  @IsNumber()
  @Min(0)
  revisions: number;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGigMediaDto)
  media: CreateGigMediaDto[];
}

// --------------------
// Gig DTO
// --------------------
export class CreateGigDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  title: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  description: string;

  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  category: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) =>
    value?.map((tag: string) => tag.trim().toLowerCase()),
  )
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGigPackageDto)
  packages: CreateGigPackageDto[];
}
