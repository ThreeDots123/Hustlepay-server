import { Exclude, Expose, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class FreelancerProfileDto {
  @ApiProperty({
    description: "The name that should be displayed for the user",
    example: "Mr Codes",
  })
  @Expose()
  displayName: string;

  @ApiProperty({
    description: "The freelancer's bio",
    example: "Hello World",
  })
  @Expose()
  bio: string;

  @ApiProperty({
    description: "How much they expect to be paid by the hour",
    example: 300,
  })
  @Expose()
  hourlyRate: number;

  @ApiProperty({
    description: "At what level is their experience.",
    example: "Beginner",
  })
  @Expose()
  experienceLevel: string;

  @Exclude()
  deletedAt: Date;

  constructor(partial: Partial<FreelancerProfileDto>) {
    Object.assign(this, partial);
  }
}
