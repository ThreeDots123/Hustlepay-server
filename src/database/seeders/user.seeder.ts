// @ts-nocheck

import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User, UserRole, UserStatus, AuthMethod } from "src/model/user.entity";
import { Password } from "src/model/user-password.entity";
import { ClientProfile } from "src/model/client-profile.entity";
import { FreelancerProfile } from "src/model/freelancer-profile.entity";
import { Wallet } from "src/model/wallet.entity";
import { SkillCatalog } from "src/model/skill-catalog.entity";
import { FreelancerWorkExperience } from "src/model/freelancer-work-experience.entity";
import { FreelancerPortfolio } from "src/model/freelancer-portfolio.entity";
import { FreelancerEducation } from "src/model/freelancer-education.entity";
import { FreelancerLanguage } from "src/model/freelancer-language.entity";
import { CLIENT_SEEDS, FREELANCER_SEEDS, SEED_PASSWORD } from "./seed-data";

export async function seedUsers(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const passwordRepo = dataSource.getRepository(Password);
  const clientProfileRepo = dataSource.getRepository(ClientProfile);
  const freelancerProfileRepo = dataSource.getRepository(FreelancerProfile);
  const walletRepo = dataSource.getRepository(Wallet);
  const skillRepo = dataSource.getRepository(SkillCatalog);
  const workExpRepo = dataSource.getRepository(FreelancerWorkExperience);
  const portfolioRepo = dataSource.getRepository(FreelancerPortfolio);
  const educationRepo = dataSource.getRepository(FreelancerEducation);
  const languageRepo = dataSource.getRepository(FreelancerLanguage);

  console.log("Starting user seeding...");
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const seed of CLIENT_SEEDS) {
    const existing = await userRepo.findOne({ where: { email: seed.email } });
    if (existing) {
      console.log(`Client ${seed.email} already exists, skipping...`);
      continue;
    }

    const user = await userRepo.save(
      userRepo.create({
        id: seed.id,
        firstname: seed.firstname,
        lastname: seed.lastname,
        email: seed.email,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        authMethod: AuthMethod.PASSWORD,
        isVerified: true,
      }),
    );

    await passwordRepo.save(
      passwordRepo.create({ key: passwordHash, userId: user.id }),
    );

    await clientProfileRepo.save(
      clientProfileRepo.create({
        userId: user.id,
        companyName: seed.companyName,
        phoneNumber: seed.phoneNumber,
        country: "NGN",
        industry: seed.industry,
      }),
    );

    await walletRepo.save(
      walletRepo.create({ userId: user.id, balance: 0, currency: "ngn" }),
    );

    console.log(`Created client: ${user.email}`);
  }

  for (const seed of FREELANCER_SEEDS) {
    const existing = await userRepo.findOne({ where: { email: seed.email } });
    if (existing) {
      console.log(`Freelancer ${seed.email} already exists, skipping...`);
      continue;
    }

    const user = await userRepo.save(
      userRepo.create({
        firstname: seed.firstname,
        lastname: seed.lastname,
        email: seed.email,
        role: UserRole.FREELANCER,
        // Pre-activated so the demo data is usable without a manual admin step.
        status: UserStatus.ACTIVE,
        authMethod: AuthMethod.PASSWORD,
        isVerified: true,
      }),
    );

    await passwordRepo.save(
      passwordRepo.create({ key: passwordHash, userId: user.id }),
    );

    const skills: SkillCatalog[] = [];
    for (const skillName of seed.skills) {
      let skill = await skillRepo.findOne({ where: { name: skillName } });
      if (!skill) {
        skill = await skillRepo.save(skillRepo.create({ name: skillName }));
      }
      skills.push(skill);
    }

    const profile = await freelancerProfileRepo.save(
      freelancerProfileRepo.create({
        userId: user.id,
        displayName: `${seed.firstname} ${seed.lastname}`,
        bio: seed.bio,
        hourlyRate: seed.hourlyRate,
        experienceLevel: seed.experienceLevel,
        location: seed.location,
        skills,
      }),
    );

    await workExpRepo.save(
      workExpRepo.create({
        freelancerProfileId: profile.id,
        jobTitle: seed.workExperience.jobTitle,
        company: seed.workExperience.company,
        duration: seed.workExperience.duration,
        description: seed.workExperience.description,
      }),
    );

    await portfolioRepo.save(
      portfolioRepo.create({
        freelancerProfileId: profile.id,
        title: seed.portfolio.title,
        description: seed.portfolio.description,
      }),
    );

    await educationRepo.save(
      educationRepo.create({
        freelancerProfileId: profile.id,
        degree: seed.education.degree,
        school: seed.education.school,
        year: seed.education.year,
      }),
    );

    await languageRepo.save(
      languageRepo.create({
        freelancerProfileId: profile.id,
        language: "English",
        proficiency: "Fluent",
      }),
    );

    await walletRepo.save(
      walletRepo.create({ userId: user.id, balance: 0, currency: "ngn" }),
    );

    console.log(`Created freelancer: ${user.email}`);
  }

  console.log("✅ User seeding completed successfully!");
}
