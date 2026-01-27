import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, IsNull } from "typeorm";
import { Milestone, MilestoneStatus } from "src/model/milestone.entity";
import { Contract, ContractStatus } from "src/model/contract.entity";
import { User } from "src/model/user.entity";
import { Payment, PaymentStatus } from "src/model/payment.entity";
import { Wallet } from "src/model/wallet.entity";
import { CreateMilestoneDto } from "./dto/create-milestone.dto";
import { SubmitMilestoneDto } from "./dto/submit-milestone.dto";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

@Injectable()
export class MilestoneService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createMilestone(
    client: User,
    dto: CreateMilestoneDto,
  ): Promise<Milestone> {
    return this.dataSource.transaction(async (manager) => {
      // Find contract with relations
      const contract = await manager.findOne(Contract, {
        where: { id: dto.contractId },
        relations: ["client"],
      });

      if (!contract) {
        throw new NotFoundException("Contract not found");
      }

      // Verify contract belongs to the client
      if (contract.clientId !== client.id) {
        throw new ForbiddenException(
          "You can only create milestones for your own contracts",
        );
      }

      // Verify contract is in a valid status for creating milestones
      if (
        contract.status !== ContractStatus.AWAITING_PAYMENT
        // &&
        // contract.status !== ContractStatus.ACTIVE
      ) {
        throw new BadRequestException(
          `Cannot create milestones for contract in status: ${contract.status}`,
        );
      }

      // Check if this is a parent or child milestone
      if (dto.parentId) {
        // Creating a child milestone
        const parentMilestone = await manager.findOne(Milestone, {
          where: { id: dto.parentId, contractId: contract.id },
          relations: ["children"],
        });

        if (!parentMilestone) {
          throw new NotFoundException("Parent milestone not found");
        }

        // Verify parent milestone belongs to this contract
        if (parentMilestone.contractId !== contract.id) {
          throw new BadRequestException(
            "Parent milestone does not belong to this contract",
          );
        }

        // Verify parent milestone is not yet accepted (can't add children after acceptance)
        if (
          parentMilestone.status !== MilestoneStatus.DRAFT &&
          parentMilestone.status !== MilestoneStatus.PENDING_ACCEPTANCE
        ) {
          throw new BadRequestException(
            `Cannot add child milestones. Parent milestone status: ${parentMilestone.status}`,
          );
        }

        // Validate that total child milestone amounts don't exceed parent amount
        const existingChildren = parentMilestone.children || [];
        const totalChildAmount =
          existingChildren.reduce((sum, m) => sum + m.amount, 0) + dto.amount;

        if (totalChildAmount > parentMilestone.amount) {
          throw new BadRequestException(
            `Total child milestone amounts (${totalChildAmount}) cannot exceed parent milestone amount (${parentMilestone.amount})`,
          );
        }

        // Create child milestone
        const childMilestone = manager.create(Milestone, {
          contract,
          parent: parentMilestone,
          title: dto.title,
          description: dto.description,
          amount: dto.amount,
          status: MilestoneStatus.PENDING,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        });

        return await manager.save(childMilestone);
      } else {
        // Creating a parent milestone
        // Check if a parent milestone already exists for this contract
        const existingParent = await manager.findOne(Milestone, {
          where: { contractId: contract.id, parentId: IsNull() },
        });

        if (existingParent) {
          throw new BadRequestException(
            "A parent milestone already exists for this contract. Create child milestones instead.",
          );
        }

        // Validate that parent milestone amount doesn't exceed contract amount
        if (dto.amount > contract.amount) {
          throw new BadRequestException(
            `Parent milestone amount (${dto.amount}) cannot exceed contract amount (${contract.amount})`,
          );
        }

        // Create parent milestone with PENDING_ACCEPTANCE status
        const parentMilestone = manager.create(Milestone, {
          contract,
          title: dto.title,
          description: dto.description,
          amount: dto.amount,
          status: MilestoneStatus.PENDING_ACCEPTANCE, // Waiting for freelancer to accept
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        });

        return await manager.save(parentMilestone);
      }
    });
  }

  async acceptParentMilestone(
    freelancer: User,
    parentMilestoneId: string,
  ): Promise<Milestone> {
    return this.dataSource.transaction(async (manager) => {
      // Find parent milestone with contract relations
      const parentMilestone = await manager.findOne(Milestone, {
        where: { id: parentMilestoneId },
        relations: ["contract", "contract.freelancer", "children"],
      });

      if (!parentMilestone) {
        throw new NotFoundException("Parent milestone not found");
      }

      // Verify it's actually a parent milestone
      if (parentMilestone.parentId) {
        throw new BadRequestException("This is not a parent milestone");
      }

      // Verify milestone belongs to freelancer's contract
      if (parentMilestone.contract.freelancerId !== freelancer.id) {
        throw new ForbiddenException(
          "You can only accept milestones for your own contracts",
        );
      }

      // Verify milestone is in PENDING_ACCEPTANCE status
      if (parentMilestone.status !== MilestoneStatus.PENDING_ACCEPTANCE) {
        throw new BadRequestException(
          `Parent milestone must be in PENDING_ACCEPTANCE status to accept. Current status: ${parentMilestone.status}`,
        );
      }

      // Update parent milestone status to ACCEPTED
      parentMilestone.status = MilestoneStatus.ACCEPTED;

      //update contract status to Active (as the payment occurs in the milestones and the payment is in bits)
      parentMilestone.contract.status = ContractStatus.ACTIVE;
      await manager.save(parentMilestone.contract);

      return await manager.save(parentMilestone);
    });
  }

  async submitMilestone(
    freelancer: User,
    milestoneId: string,
    dto: SubmitMilestoneDto,
    files: Express.Multer.File[] = [],
  ): Promise<Milestone> {
    return this.dataSource.transaction(async (manager) => {
      // Find milestone with contract relations
      const milestone = await manager.findOne(Milestone, {
        where: { id: milestoneId },
        relations: ["contract", "contract.freelancer", "parent"],
      });

      if (!milestone) {
        throw new NotFoundException("Milestone not found");
      }

      // Verify milestone belongs to freelancer's contract
      if (milestone.contract.freelancerId !== freelancer.id) {
        throw new ForbiddenException(
          "You can only submit milestones for your own contracts",
        );
      }

      // Verify this is a child milestone (can't submit parent milestones)
      if (!milestone.parentId) {
        throw new BadRequestException(
          "Cannot submit parent milestones. Only child milestones can be submitted.",
        );
      }

      // Verify parent milestone is accepted
      if (milestone.parent?.status !== MilestoneStatus.ACCEPTED) {
        throw new BadRequestException(
          "Parent milestone must be accepted before submitting child milestones",
        );
      }

      // Verify milestone is in APPROVED status (after payment)
      if (milestone.status !== MilestoneStatus.APPROVED) {
        throw new BadRequestException(
          `Milestone must be in APPROVED status to submit. Current status: ${milestone.status}`,
        );
      }

      // Upload files to Cloudinary if any
      let attachments: Array<{
        id: string;
        name: string;
        type: "image" | "video" | "document" | "other";
        size: number;
        url: string;
      }> | undefined;

      if (files && files.length > 0) {
        const uploadResults =
          await this.cloudinaryService.uploadMultipleFiles(
            files,
            `milestones/${milestoneId}/submissions`,
          );

        const getFileType = (
          mimeType: string,
        ): "image" | "video" | "document" | "other" => {
          if (mimeType.startsWith("image/")) return "image";
          if (mimeType.startsWith("video/")) return "video";
          if (
            mimeType.includes("pdf") ||
            mimeType.includes("document") ||
            mimeType.includes("word")
          )
            return "document";
          return "other";
        };

        attachments = uploadResults.map((result, index) => {
          const file = files[index];
          return {
            id: result.public_id,
            name: file.originalname,
            type: getFileType(file.mimetype),
            size: result.bytes,
            url: result.secure_url,
          };
        });
      }

      // Concatenate links array into single string (separated by "|")
      const submissionLinks =
        dto.links && dto.links.length > 0 ? dto.links.join("|") : undefined;

      // Update milestone with submission data
      milestone.status = MilestoneStatus.SUBMITTED;
      milestone.submissionDescription = dto.description;
      milestone.submissionLinks = submissionLinks;
      milestone.submissionAttachments = attachments;

      return await manager.save(milestone);
    });
  }

  async approveMilestone(
    client: User,
    milestoneId: string,
  ): Promise<Milestone> {
    return this.dataSource.transaction(async (manager) => {
      // Find milestone with contract relations
      const milestone = await manager.findOne(Milestone, {
        where: { id: milestoneId },
        relations: ["contract", "contract.client", "parent"],
      });

      if (!milestone) {
        throw new NotFoundException("Milestone not found");
      }

      // Verify milestone belongs to client's contract
      if (milestone.contract.clientId !== client.id) {
        throw new ForbiddenException(
          "You can only approve milestones for your own contracts",
        );
      }

      // Verify this is a child milestone (can't approve parent milestones)
      if (!milestone.parentId) {
        throw new BadRequestException(
          "Cannot approve parent milestones. Only child milestones can be approved.",
        );
      }

      // Verify milestone is in SUBMITTED status
      if (milestone.status !== MilestoneStatus.SUBMITTED) {
        throw new BadRequestException(
          `Milestone must be in SUBMITTED status to approve. Current status: ${milestone.status}`,
        );
      }

      // Find escrowed payment for this milestone
      const payments = await manager.find(Payment, {
        where: {
          contractId: milestone.contractId,
          status: PaymentStatus.ESCROWED,
        },
        order: { createdAt: "DESC" },
      });

      // Find payment that matches this milestone (check providerRaw metadata)
      const milestonePayment = payments.find(
        (p) =>
          p.providerRaw?.metadata?.milestoneId === milestoneId ||
          (p.providerRaw as any)?.milestoneId === milestoneId,
      );

      if (!milestonePayment) {
        throw new NotFoundException(
          `Escrowed payment not found for milestone ${milestoneId}`,
        );
      }

      // Get or create freelancer wallet
      let wallet = await manager.findOne(Wallet, {
        where: { userId: milestone.contract.freelancerId },
      });

      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = manager.create(Wallet, {
          userId: milestone.contract.freelancerId,
          balance: 0,
          currency: milestone.contract.currency || "ngn",
        });
        wallet = await manager.save(wallet);
      }

      // Credit freelancer wallet
      wallet.balance = Number(wallet.balance) + milestone.amount;
      await manager.save(wallet);

      // Update payment status to RELEASED
      milestonePayment.status = PaymentStatus.RELEASED;
      await manager.save(milestonePayment);

      // Update milestone status to COMPLETED
      milestone.status = MilestoneStatus.COMPLETED;

      return await manager.save(milestone);
    });
  }

  async rejectMilestone(
    client: User,
    milestoneId: string,
    reason?: string,
  ): Promise<Milestone> {
    return this.dataSource.transaction(async (manager) => {
      // Find milestone with contract relations
      const milestone = await manager.findOne(Milestone, {
        where: { id: milestoneId },
        relations: ["contract", "contract.client"],
      });

      if (!milestone) {
        throw new NotFoundException("Milestone not found");
      }

      // Verify milestone belongs to client's contract
      if (milestone.contract.clientId !== client.id) {
        throw new ForbiddenException(
          "You can only reject milestones for your own contracts",
        );
      }

      // Verify milestone is in SUBMITTED status
      if (milestone.status !== MilestoneStatus.SUBMITTED) {
        throw new BadRequestException(
          `Milestone must be in SUBMITTED status to reject. Current status: ${milestone.status}`,
        );
      }

      // Update milestone status back to APPROVED (not PENDING)
      milestone.status = MilestoneStatus.APPROVED;
      if (reason) {
        milestone.submissionDescription = milestone.submissionDescription
          ? `${milestone.submissionDescription}\n\nRejection Reason: ${reason}`
          : `Rejection Reason: ${reason}`;
      }

      return await manager.save(milestone);
    });
  }

  async getMilestonesForContract(
    contractId: string,
    userId: string,
  ): Promise<Milestone[]> {
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
        "You can only view milestones for contracts you are involved in",
      );
    }

    // Get parent milestone with children and their deliverables
    const parentMilestone = await this.milestoneRepo.findOne({
      where: { contractId, parentId: IsNull() },
      relations: ["children", "children.deliverables"],
      order: { createdAt: "ASC" },
    });

    if (!parentMilestone) {
      return [];
    }

    // Return parent with children (children now include their deliverables)
    return [parentMilestone];
  }

  async findOne(milestoneId: string): Promise<Milestone> {
    const milestone = await this.milestoneRepo.findOne({
      where: { id: milestoneId },
      relations: [
        "contract",
        "contract.client",
        "contract.freelancer",
        "parent",
        "children",
        "deliverables",
      ],
    });

    if (!milestone) {
      throw new NotFoundException("Milestone not found");
    }

    return milestone;
  }
}
