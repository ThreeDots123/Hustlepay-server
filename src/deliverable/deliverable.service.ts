import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Deliverable, DeliverableStatus } from "src/model/deliverable.entity";
import { Contract, ContractStatus } from "src/model/contract.entity";
import { Milestone, MilestoneStatus } from "src/model/milestone.entity";
import { User } from "src/model/user.entity";
import { CreateDeliverableDto } from "./dto/create-deliverable.dto";

@Injectable()
export class DeliverableService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Deliverable)
    private readonly deliverableRepo: Repository<Deliverable>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
  ) {}

  async createDeliverable(
    client: User,
    dto: CreateDeliverableDto,
  ): Promise<Deliverable> {
    return this.dataSource.transaction(async (manager) => {
      // Validate that either contractId or milestoneId is provided, but not both
      if (!dto.contractId && !dto.milestoneId) {
        throw new BadRequestException(
          "Either contractId or milestoneId must be provided",
        );
      }

      if (dto.contractId && dto.milestoneId) {
        throw new BadRequestException(
          "Cannot provide both contractId and milestoneId. Provide only one.",
        );
      }

      let contract: Contract | null = null;
      let milestone: Milestone | null = null;

      if (dto.contractId) {
        // Creating deliverable for contract (full payment project)
        contract = await manager.findOne(Contract, {
          where: { id: dto.contractId },
          relations: ["client"],
        });

        if (!contract) {
          throw new NotFoundException("Contract not found");
        }

        // Verify contract belongs to the client
        if (contract.clientId !== client.id) {
          throw new ForbiddenException(
            "You can only create deliverables for your own contracts",
          );
        }

        // Verify contract is in a valid status
        if (
          contract.status !== ContractStatus.AWAITING_PAYMENT &&
          contract.status !== ContractStatus.ACTIVE
        ) {
          throw new BadRequestException(
            `Cannot create deliverables for contract in status: ${contract.status}`,
          );
        }
      } else if (dto.milestoneId) {
        // Creating deliverable for milestone
        milestone = await manager.findOne(Milestone, {
          where: { id: dto.milestoneId },
          relations: ["contract", "contract.client"],
        });

        if (!milestone) {
          throw new NotFoundException("Milestone not found");
        }

        // Verify milestone belongs to client's contract
        if (milestone.contract.clientId !== client.id) {
          throw new ForbiddenException(
            "You can only create deliverables for milestones in your own contracts",
          );
        }

        // Verify milestone is a child milestone (can't add deliverables to parent)
        if (!milestone.parentId) {
          throw new BadRequestException(
            "Cannot add deliverables to parent milestones. Add deliverables to child milestones only.",
          );
        }

        contract = milestone.contract;
      }

      // Get existing deliverables to determine order
      const existingDeliverables = await manager.find(Deliverable, {
        where: dto.contractId
          ? { contractId: dto.contractId }
          : { milestoneId: dto.milestoneId },
      });

      const order = dto.order ?? existingDeliverables.length;

      // Create deliverable
      const deliverable = manager.create(Deliverable, {
        contract: contract!,
        milestone: milestone || undefined,
        title: dto.title,
        description: dto.description,
        order,
        status: DeliverableStatus.PENDING,
      });

      return await manager.save(deliverable);
    });
  }

  async getDeliverablesForContract(
    contractId: string,
    userId: string,
  ): Promise<Deliverable[]> {
    // Find contract to verify user has access
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ["client", "freelancer"],
    });

    if (!contract) {
      throw new NotFoundException("Contract not found");
    }

    // Verify user is either client or freelancer
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException(
        "You can only view deliverables for contracts you are involved in",
      );
    }

    // Get deliverables for contract (not associated with milestones)
    return this.deliverableRepo.find({
      // @ts-ignore
      where: { contractId, milestoneId: null },
      order: { order: "ASC", createdAt: "ASC" },
    });
  }

  async getDeliverablesForMilestone(
    milestoneId: string,
    userId: string,
  ): Promise<Deliverable[]> {
    // Find milestone to verify user has access
    const milestone = await this.milestoneRepo.findOne({
      where: { id: milestoneId },
      relations: ["contract", "contract.client", "contract.freelancer"],
    });

    if (!milestone) {
      throw new NotFoundException("Milestone not found");
    }

    // Verify user is either client or freelancer
    if (
      milestone.contract.clientId !== userId &&
      milestone.contract.freelancerId !== userId
    ) {
      throw new ForbiddenException(
        "You can only view deliverables for milestones in contracts you are involved in",
      );
    }

    // Get deliverables for milestone
    return this.deliverableRepo.find({
      where: { milestoneId },
      order: { order: "ASC", createdAt: "ASC" },
    });
  }

  async updateDeliverableStatus(
    userId: string,
    deliverableId: string,
    status: DeliverableStatus,
  ): Promise<Deliverable> {
    return this.dataSource.transaction(async (manager) => {
      const deliverable = await manager.findOne(Deliverable, {
        where: { id: deliverableId },
        relations: [
          "contract",
          "contract.client",
          "contract.freelancer",
          "milestone",
        ],
      });

      if (!deliverable) {
        throw new NotFoundException("Deliverable not found");
      }

      // Determine contract from deliverable
      const contract = deliverable.contract || deliverable.milestone?.contract;

      if (!contract) {
        throw new NotFoundException("Contract not found for deliverable");
      }

      // Verify user is either client or freelancer
      if (contract.clientId !== userId && contract.freelancerId !== userId) {
        throw new ForbiddenException(
          "You can only update deliverables for contracts you are involved in",
        );
      }

      // Update status
      deliverable.status = status;

      return await manager.save(deliverable);
    });
  }

  async deleteDeliverable(client: User, deliverableId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const deliverable = await manager.findOne(Deliverable, {
        where: { id: deliverableId },
        relations: [
          "contract",
          "contract.client",
          "milestone",
          "milestone.contract",
        ],
      });

      if (!deliverable) {
        throw new NotFoundException("Deliverable not found");
      }

      // Determine contract from deliverable
      const contract = deliverable.contract || deliverable.milestone?.contract;

      if (!contract) {
        throw new NotFoundException("Contract not found for deliverable");
      }

      // Only client can delete deliverables
      if (contract.clientId !== client.id) {
        throw new ForbiddenException(
          "Only the contract owner can delete deliverables",
        );
      }

      await manager.remove(deliverable);
    });
  }

  async findOne(deliverableId: string): Promise<Deliverable> {
    const deliverable = await this.deliverableRepo.findOne({
      where: { id: deliverableId },
      relations: [
        "contract",
        "contract.client",
        "contract.freelancer",
        "milestone",
        "milestone.contract",
      ],
    });

    if (!deliverable) {
      throw new NotFoundException("Deliverable not found");
    }

    return deliverable;
  }
}
