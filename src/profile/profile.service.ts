import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { ClientProfile as ClientProfileEntity } from "src/model/client-profile.entity";
import { FreelancerProfile as FreelancerProfileEntity } from "src/model/freelancer-profile.entity";
import BaseService from "src/interface/service/base.service";
import { FreelancerProfileDto } from "./dto/freelancer-profile.dto";

@Injectable()
export class ProfileService extends BaseService {
  constructor(
    @InjectRepository(FreelancerProfileEntity)
    private readonly freelancerRepo: Repository<FreelancerProfileEntity>,
    @InjectRepository(ClientProfileEntity)
    private readonly clientRepo: Repository<ClientProfileEntity>,
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
}
