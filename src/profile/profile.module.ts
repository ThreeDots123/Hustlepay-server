import { Module } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FreelancerProfile } from "src/model/freelancer-profile.entity";
import { ClientProfile } from "src/model/client-profile.entity";
import { User } from "src/model/user.entity";
import { FreelancerWorkExperience } from "src/model/freelancer-work-experience.entity";
import { FreelancerPortfolio } from "src/model/freelancer-portfolio.entity";
import { FreelancerEducation } from "src/model/freelancer-education.entity";
import { FreelancerLanguage } from "src/model/freelancer-language.entity";
import { SkillCatalog } from "src/model/skill-catalog.entity";
import { CloudinaryModule } from "src/cloudinary/cloudinary.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FreelancerProfile,
      ClientProfile,
      User,
      FreelancerWorkExperience,
      FreelancerPortfolio,
      FreelancerEducation,
      FreelancerLanguage,
      SkillCatalog,
    ]),
    CloudinaryModule,
  ],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
