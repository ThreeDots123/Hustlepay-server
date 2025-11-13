import { Expose, Type } from "class-transformer";
import { PackageType } from "src/model/gig-package.entity";
import { MediaType } from "src/model/gig-media.entity";

// --------------------
// Freelancer Profile
// --------------------
export class FreelancerProfileResponseDto {
  @Expose()
  id: string;

  @Expose()
  displayName: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  rating?: number; // average rating from reviews
}

// --------------------
// Gig Media
// --------------------
export class GigMediaResponseDto {
  @Expose()
  id: string;

  @Expose()
  type: MediaType;

  @Expose()
  url: string;

  @Expose()
  alt_text?: string;
}

// --------------------
// Gig Packages
// --------------------
export class GigPackageResponseDto {
  @Expose()
  id: string;

  @Expose()
  type: PackageType;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  price: number;

  @Expose()
  deliveryDays: number;

  @Expose()
  revisions: number;

  @Expose()
  features: string[];

  @Expose()
  @Type(() => GigMediaResponseDto)
  media: GigMediaResponseDto[];
}

// --------------------
// Gig Response
// --------------------
export class GigResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  category: string;

  @Expose()
  tags: string[];

  @Expose()
  createdAt: Date;

  // @Expose()
  // updatedAt: Date;

  @Expose()
  @Type(() => GigPackageResponseDto)
  packages: GigPackageResponseDto[];

  @Expose()
  @Type(() => FreelancerProfileResponseDto)
  freelancer: FreelancerProfileResponseDto;
}
