import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { ClientProfile as ClientProfileEntity } from "src/model/client-profile.entity";
import { FreelancerProfile as FreelancerProfileEntity } from "src/model/freelancer-profile.entity";
import BaseService from "src/interface/service/base.service";
import { FreelancerProfileDto } from "./dto/freelancer-profile.dto";
import { UpdateFreelancerProfileDto } from "./dto/update-freelancer-profile.dto";
import { User, UserRole, UserStatus } from "src/model/user.entity";
import { SkillCatalog } from "src/model/skill-catalog.entity";
import { FreelancerWorkExperience } from "src/model/freelancer-work-experience.entity";
import { FreelancerPortfolio } from "src/model/freelancer-portfolio.entity";
import { FreelancerEducation } from "src/model/freelancer-education.entity";
import { FreelancerLanguage } from "src/model/freelancer-language.entity";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

@Injectable()
export class ProfileService extends BaseService {
  constructor(
    @InjectRepository(FreelancerProfileEntity)
    private readonly freelancerRepo: Repository<FreelancerProfileEntity>,
    @InjectRepository(ClientProfileEntity)
    private readonly clientRepo: Repository<ClientProfileEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SkillCatalog)
    private readonly skillRepo: Repository<SkillCatalog>,
    @InjectRepository(FreelancerWorkExperience)
    private readonly workExpRepo: Repository<FreelancerWorkExperience>,
    @InjectRepository(FreelancerPortfolio)
    private readonly portfolioRepo: Repository<FreelancerPortfolio>,
    @InjectRepository(FreelancerEducation)
    private readonly educationRepo: Repository<FreelancerEducation>,
    @InjectRepository(FreelancerLanguage)
    private readonly languageRepo: Repository<FreelancerLanguage>,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super();
  }

  async createFreelacerProfile(
    userId: string,
    transactionalEntity?: EntityManager | undefined,
  ) {
    // Starts out with profile being empty
    const newProfileInstance = this.freelancerRepo.create({ userId });

    return await this.performEntityOps<
      FreelancerProfileEntity,
      FreelancerProfileEntity
    >({
      repositoryManager: this.freelancerRepo,
      transactionalEntity,
      action: "save",
      opsArgs: [newProfileInstance],
    });
  }

  async createClientProfile(
    userId: string,
    transactionalEntity?: EntityManager | undefined,
  ) {
    // Starts out with profile being empty
    const newProfileInstance = this.clientRepo.create({ userId });

    return await this.performEntityOps<
      ClientProfileEntity,
      ClientProfileEntity
    >({
      repositoryManager: this.clientRepo,
      transactionalEntity,
      action: "save",
      opsArgs: [newProfileInstance],
    });
  }

  async updateFreelancerProfile(
    userId: string,
    newRecord: FreelancerProfileDto,
    transactionalEntity?: EntityManager,
  ) {
    return await this.performEntityOps<
      FreelancerProfileEntity,
      FreelancerProfileEntity
    >({
      repositoryManager: this.freelancerRepo,
      transactionalEntity,
      action: "update",
      opsArgs: [FreelancerProfileEntity, { userId }, { ...newRecord }],
    });
  }

  async updateClientProfile(
    userId: string,
    newRecord: Partial<ClientProfileEntity>,
    transactionalEntity?: EntityManager,
  ) {
    return this.performEntityOps<ClientProfileEntity, ClientProfileEntity>({
      repositoryManager: this.clientRepo,
      transactionalEntity,
      action: "update",
      opsArgs: [ClientProfileEntity, { userId }, { ...newRecord }],
    });
  }

  async retreiveProfile(
    userId: string,
    userType: "client" | "freelancer",
    transactionalEntity?: EntityManager,
  ) {
    if (userType === "freelancer")
      return this.performEntityOps<
        FreelancerProfileEntity,
        FreelancerProfileEntity
      >({
        repositoryManager: this.freelancerRepo,
        transactionalEntity,
        action: "findOne",
        opsArgs: [
          FreelancerProfileEntity,
          {
            where: { userId },
            relations: [
              "skills",
              "workExperiences",
              "portfolios",
              "educations",
              "languages",
              "user",
            ],
          },
        ],
      });

    return this.performEntityOps<ClientProfileEntity, ClientProfileEntity>({
      repositoryManager: this.clientRepo,
      transactionalEntity,
      action: "findOne",
      opsArgs: [
        ClientProfileEntity,
        {
          where: { userId },
        },
      ],
    });
  }

  async updateFullFreelancerProfile(
    userId: string,
    dto: UpdateFreelancerProfileDto,
    profilePictureFile?: Express.Multer.File,
  ) {
    // Get or create profile
    let profile = await this.freelancerRepo.findOne({
      where: { userId },
      relations: [
        "skills",
        "workExperiences",
        "portfolios",
        "educations",
        "languages",
      ],
    });

    if (!profile) {
      profile = this.freelancerRepo.create({ userId });
      profile = await this.freelancerRepo.save(profile);
    }

    // Handle profile picture upload
    if (profilePictureFile) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        profilePictureFile,
        `freelancer-profiles/${userId}`,
      );
      dto.profilePictureUrl = uploadResult.secure_url;
    }

    // Update basic profile fields
    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.hourlyRate !== undefined) profile.hourlyRate = dto.hourlyRate;
    if (dto.experienceLevel !== undefined)
      profile.experienceLevel = dto.experienceLevel;
    if (dto.location !== undefined) profile.location = dto.location;
    if (dto.profilePictureUrl !== undefined)
      profile.profilePictureUrl = dto.profilePictureUrl;

    // Handle skills
    if (dto.skills !== undefined) {
      const skills: SkillCatalog[] = [];
      for (const skillName of dto.skills) {
        let skill = await this.skillRepo.findOne({
          where: { name: skillName },
        });
        if (!skill) {
          skill = this.skillRepo.create({ name: skillName });
          await this.skillRepo.save(skill);
        }
        skills.push(skill);
      }
      profile.skills = skills;
    }

    // Save profile first
    profile = await this.freelancerRepo.save(profile);

    // Handle work experiences
    if (dto.workExperiences !== undefined) {
      // Get existing experiences
      const existingExps = await this.workExpRepo.find({
        where: { freelancerProfileId: profile.id },
      });
      const existingIds = dto.workExperiences
        .filter((exp) => exp.id)
        .map((exp) => exp.id);

      // Delete ones not in the new list
      const toDelete = existingExps.filter(
        (exp) => !existingIds.includes(exp.id),
      );
      if (toDelete.length > 0) {
        await this.workExpRepo.remove(toDelete);
      }

      // Update or create
      for (const expDto of dto.workExperiences) {
        if (expDto.id) {
          await this.workExpRepo.update(
            { id: expDto.id, freelancerProfileId: profile.id },
            {
              jobTitle: expDto.jobTitle,
              company: expDto.company,
              duration: expDto.duration,
              description: expDto.description,
            },
          );
        } else {
          const newExp = this.workExpRepo.create({
            freelancerProfileId: profile.id,
            jobTitle: expDto.jobTitle,
            company: expDto.company,
            duration: expDto.duration,
            description: expDto.description,
          });
          await this.workExpRepo.save(newExp);
        }
      }
    }

    // Handle portfolios
    if (dto.portfolios !== undefined) {
      const existingPorts = await this.portfolioRepo.find({
        where: { freelancerProfileId: profile.id },
      });
      const existingIds = dto.portfolios.filter((p) => p.id).map((p) => p.id);

      const toDelete = existingPorts.filter((p) => !existingIds.includes(p.id));
      if (toDelete.length > 0) {
        await this.portfolioRepo.remove(toDelete);
      }

      for (const portDto of dto.portfolios) {
        if (portDto.id) {
          await this.portfolioRepo.update(
            { id: portDto.id, freelancerProfileId: profile.id },
            {
              title: portDto.title,
              description: portDto.description,
              imageUrl: portDto.imageUrl,
            },
          );
        } else {
          const newPort = this.portfolioRepo.create({
            freelancerProfileId: profile.id,
            title: portDto.title,
            description: portDto.description,
            imageUrl: portDto.imageUrl,
          });
          await this.portfolioRepo.save(newPort);
        }
      }
    }

    // Handle educations
    if (dto.educations !== undefined) {
      const existingEdus = await this.educationRepo.find({
        where: { freelancerProfileId: profile.id },
      });
      const existingIds = dto.educations.filter((e) => e.id).map((e) => e.id);

      const toDelete = existingEdus.filter((e) => !existingIds.includes(e.id));
      if (toDelete.length > 0) {
        await this.educationRepo.remove(toDelete);
      }

      for (const eduDto of dto.educations) {
        if (eduDto.id) {
          await this.educationRepo.update(
            { id: eduDto.id, freelancerProfileId: profile.id },
            {
              degree: eduDto.degree,
              school: eduDto.school,
              year: eduDto.year,
            },
          );
        } else {
          const newEdu = this.educationRepo.create({
            freelancerProfileId: profile.id,
            degree: eduDto.degree,
            school: eduDto.school,
            year: eduDto.year,
          });
          await this.educationRepo.save(newEdu);
        }
      }
    }

    // Handle languages
    if (dto.languages !== undefined) {
      const existingLangs = await this.languageRepo.find({
        where: { freelancerProfileId: profile.id },
      });
      const existingIds = dto.languages.filter((l) => l.id).map((l) => l.id);

      const toDelete = existingLangs.filter((l) => !existingIds.includes(l.id));
      if (toDelete.length > 0) {
        await this.languageRepo.remove(toDelete);
      }

      for (const langDto of dto.languages) {
        if (langDto.id) {
          await this.languageRepo.update(
            { id: langDto.id, freelancerProfileId: profile.id },
            {
              language: langDto.language,
              proficiency: langDto.proficiency,
            },
          );
        } else {
          const newLang = this.languageRepo.create({
            freelancerProfileId: profile.id,
            language: langDto.language,
            proficiency: langDto.proficiency,
          });
          await this.languageRepo.save(newLang);
        }
      }
    }

    // Return updated profile with all relations
    return this.freelancerRepo.findOne({
      where: { id: profile.id },
      relations: [
        "skills",
        "workExperiences",
        "portfolios",
        "educations",
        "languages",
        "user",
      ],
    });
  }

  async uploadPortfolioImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const uploadResult = await this.cloudinaryService.uploadFile(
      file,
      `freelancer-portfolios/${userId}`,
    );
    return uploadResult.secure_url;
  }

  async findFreelancers(filters?: {
    page?: number;
    limit?: number;
    skills?: string[];
    skill?: string;
    experienceLevel?: string;
    hourlyRateMin?: number;
    hourlyRateMax?: number;
    query?: string;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.freelancerRepo
      .createQueryBuilder("fp")
      .leftJoinAndSelect("fp.user", "user")
      .leftJoinAndSelect("fp.skills", "skills")
      .where("user.role = :role", { role: UserRole.FREELANCER })
      .andWhere("user.status = :status", { status: UserStatus.ACTIVE })
      .andWhere("user.deletedAt IS NULL")
      .andWhere("fp.deletedAt IS NULL");

    // Search query - search in display name, bio, skills
    if (filters?.query && filters.query.trim()) {
      qb.andWhere(
        "(LOWER(fp.displayName) LIKE LOWER(:query) OR LOWER(fp.bio) LIKE LOWER(:query) OR LOWER(skills.name) LIKE LOWER(:query))",
        { query: `%${filters.query.trim()}%` },
      );
    }

    // Filter by skills (prioritize skills array over single skill)
    if (filters?.skills && filters.skills.length > 0) {
      qb.andWhere("skills.name IN (:...skills)", { skills: filters.skills });
    } else if (filters?.skill) {
      qb.andWhere("skills.name = :skill", { skill: filters.skill });
    }

    // Filter by experience level
    if (filters?.experienceLevel) {
      qb.andWhere("fp.experienceLevel = :experienceLevel", {
        experienceLevel: filters.experienceLevel,
      });
    }

    // Filter by hourly rate range
    if (
      filters?.hourlyRateMin !== undefined &&
      filters.hourlyRateMin !== null
    ) {
      qb.andWhere("fp.hourlyRate >= :hourlyRateMin", {
        hourlyRateMin: filters.hourlyRateMin,
      });
    }

    if (
      filters?.hourlyRateMax !== undefined &&
      filters.hourlyRateMax !== null
    ) {
      qb.andWhere("fp.hourlyRate <= :hourlyRateMax", {
        hourlyRateMax: filters.hourlyRateMax,
      });
    }

    // Get total count
    const total = await qb.getCount();

    // Apply pagination and ordering
    const freelancers = await qb
      .orderBy("fp.createdAt", "DESC")
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data: freelancers,
      total,
      page,
      limit,
    };
  }

  async getFreelancerProfileById(profileId: string) {
    const profile = await this.freelancerRepo.findOne({
      where: { id: profileId },
      relations: [
        "skills",
        "workExperiences",
        "portfolios",
        "educations",
        "languages",
        "user",
      ],
    });

    if (!profile) {
      throw new NotFoundException("Freelancer profile not found");
    }

    return profile;
  }
}
