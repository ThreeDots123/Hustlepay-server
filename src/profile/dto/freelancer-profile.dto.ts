import { Exclude, Expose, Transform, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

class SkillDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

class WorkExperienceDto {
  @Expose()
  id: string;

  @Expose()
  jobTitle: string;

  @Expose()
  company: string;

  @Expose()
  duration: string;

  @Expose()
  description: string;
}

class PortfolioDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  imageUrl: string;
}

class EducationDto {
  @Expose()
  id: string;

  @Expose()
  degree: string;

  @Expose()
  school: string;

  @Expose()
  year: string;
}

class LanguageDto {
  @Expose()
  id: string;

  @Expose()
  language: string;

  @Expose()
  proficiency: string;
}

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

  @ApiProperty({
    description: "Location (Nigerian state)",
    example: "Lagos",
  })
  @Expose()
  location: string;

  @ApiProperty({
    description: "Profile picture URL",
    example: "https://cloudinary.com/image.jpg",
  })
  @Expose()
  profilePictureUrl: string;

  @ApiProperty({
    type: [SkillDto],
    description: "Skills",
  })
  @Expose()
  @Type(() => SkillDto)
  skills: SkillDto[];

  @ApiProperty({
    type: [WorkExperienceDto],
    description: "Work experiences",
  })
  @Expose()
  @Type(() => WorkExperienceDto)
  workExperiences: WorkExperienceDto[];

  @ApiProperty({
    type: [PortfolioDto],
    description: "Portfolio projects",
  })
  @Expose()
  @Type(() => PortfolioDto)
  portfolios: PortfolioDto[];

  @ApiProperty({
    type: [EducationDto],
    description: "Education",
  })
  @Expose()
  @Type(() => EducationDto)
  educations: EducationDto[];

  @ApiProperty({
    type: [LanguageDto],
    description: "Languages",
  })
  @Expose()
  @Type(() => LanguageDto)
  languages: LanguageDto[];

  @Exclude()
  deletedAt: Date;

  constructor(partial: Partial<FreelancerProfileDto>) {
    Object.assign(this, partial);
  }
}
