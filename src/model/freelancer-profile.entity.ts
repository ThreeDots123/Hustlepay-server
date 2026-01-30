import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { User } from "./user.entity";
import { SkillCatalog } from "./skill-catalog.entity";
import { FreelancerWorkExperience } from "./freelancer-work-experience.entity";
import { FreelancerPortfolio } from "./freelancer-portfolio.entity";
import { FreelancerEducation } from "./freelancer-education.entity";
import { FreelancerLanguage } from "./freelancer-language.entity";

@Entity("freelancer_profile")
export class FreelancerProfile extends SoftDeletableEntity {
  protected id_prefix = "frp";

  @Column({ name: "display_name", nullable: true })
  displayName: string;

  @Column({ name: "bio", type: "text", nullable: true })
  bio: string;

  @Column({ name: "hourly_rate", type: "decimal", nullable: true })
  hourlyRate: number;

  @Column({ name: "experience_level", nullable: true })
  experienceLevel: string; // e.g. "beginner", "intermediate", "expert"

  @Column({ name: "location", nullable: true })
  location: string; // Nigerian state

  @Column({ name: "profile_picture_url", nullable: true })
  profilePictureUrl: string;

  @Column({ name: "user_id", nullable: false })
  userId: string;

  @OneToOne(() => User, (user) => user.freelancerProfile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToMany(() => SkillCatalog, (skill) => skill.freelancers, {
    cascade: true,
  })
  @JoinTable({ name: "freelancer_skills" })
  skills: SkillCatalog[];

  @OneToMany(() => FreelancerWorkExperience, (exp) => exp.freelancerProfile, {
    cascade: true,
  })
  workExperiences: FreelancerWorkExperience[];

  @OneToMany(
    () => FreelancerPortfolio,
    (portfolio) => portfolio.freelancerProfile,
    {
      cascade: true,
    },
  )
  portfolios: FreelancerPortfolio[];

  @OneToMany(
    () => FreelancerEducation,
    (education) => education.freelancerProfile,
    {
      cascade: true,
    },
  )
  educations: FreelancerEducation[];

  @OneToMany(
    () => FreelancerLanguage,
    (language) => language.freelancerProfile,
    {
      cascade: true,
    },
  )
  languages: FreelancerLanguage[];
}
