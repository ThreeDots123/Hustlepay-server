import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In, EntityManager } from "typeorm";
import { Contract, ContractStatus } from "../model/contract.entity";
import { Bid, BidStatus, BidRateType } from "../model/bid.entity";
import { CreateContractDto } from "./dto/create-contract.dto";
import { User } from "../model/user.entity";
import { Proposal, ProposalStatus } from "../model/proposal.entity";
import { Milestone, MilestoneStatus } from "../model/milestone.entity";
import { Payment, PaymentStatus } from "../model/payment.entity";
import { Wallet } from "../model/wallet.entity";
import { TransactionService } from "src/transaction/transaction.service";
import {
  TransactionType,
  TransactionStatus,
} from "../model/transaction.entity";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { SubmitContractDto } from "./dto/submit-contract.dto";

@Injectable()
export class ContractService {
  constructor(
    private dataSource: DataSource,
    private readonly transactionService: TransactionService,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createFromBid(client: User, dto: CreateContractDto) {
    return this.dataSource.transaction(async (manager) => {
      const bid = await manager.findOne(Bid, {
        where: { id: dto.bidId },
        relations: ["proposal", "freelancer", "proposal.client"],
      });
      if (!bid) throw new NotFoundException("Bid not found");
      if (bid.proposal.client.id !== client.id) throw new ForbiddenException();
      if (bid.status !== BidStatus.ACCEPTED)
        throw new BadRequestException(
          "Bid must be accepted before creating contract",
        );

      const contract = manager.create(Contract, {
        proposal: bid.proposal,
        bid, // Link to the bid
        client,
        freelancer: bid.freelancer,
        amount: dto.amount,
        currency: dto.currency || "ngn",
        durationDays: bid.proposedDurationDays, // From bid
        rateType: bid.rateType, // From bid
        status: ContractStatus.AWAITING_PAYMENT,
      });
      const saved = await manager.save(contract);
      // update proposal status
      bid.proposal.status = ProposalStatus.HIRED;
      await manager.save(bid.proposal);
      return saved;
    });
  }

  async findOne(id: string) {
    const c = await this.contractRepo.findOne({
      where: { id },
      relations: ["client", "freelancer", "milestones", "payments"],
    });
    if (!c) throw new NotFoundException("Contract not found");
    return c;
  }

  // ✅ Get all contracts for a proposal (for client to see accepted freelancers)
  async findByProposal(proposalId: string, clientId: string) {
    return this.contractRepo.find({
      where: {
        proposalId,
        clientId,
      },
      relations: ["freelancer", "proposal", "freelancer.freelancerProfile"],
      order: { createdAt: "DESC" },
    });
  }

  // ✅ Get all pending_client_approval contracts for client responses (excluding proposals with active contracts)
  async findResponsesContractsForClient(clientId: string) {
    console.log("Here");
    // Get all proposals for client
    const proposals = await this.proposalRepo.find({
      where: { clientId },
      select: ["id"],
    });

    if (proposals.length === 0) {
      return [];
    }

    const proposalIds = proposals.map((p) => p.id);

    // Get all proposals that have active contracts (awaiting_payment, active, or completed)
    const proposalsWithActiveContracts = await this.contractRepo
      .createQueryBuilder("contract")
      .select("DISTINCT contract.proposalId", "proposalId")
      .where("contract.proposalId IN (:...proposalIds)", { proposalIds })
      .andWhere("contract.status IN (:...statuses)", {
        statuses: [
          ContractStatus.AWAITING_PAYMENT,
          ContractStatus.ACTIVE,
          ContractStatus.COMPLETED,
        ],
      })
      .getRawMany();

    const activeContractProposalIds = new Set(
      proposalsWithActiveContracts.map((c) => c.proposalId),
    );

    // Filter out proposals with active contracts
    const proposalsWithoutActiveContracts = proposalIds.filter(
      (id) => !activeContractProposalIds.has(id),
    );

    if (proposalsWithoutActiveContracts.length === 0) {
      return [];
    }

    // Get all pending_client_approval contracts for proposals without active contracts
    return this.contractRepo.find({
      where: {
        proposalId: In(proposalsWithoutActiveContracts),
        status: ContractStatus.PENDING_CLIENT_APPROVAL,
      },
      relations: ["freelancer", "proposal", "freelancer.freelancerProfile"],
      order: { createdAt: "DESC" },
    });
  }

  // ✅ Approve a contract (move from PENDING_CLIENT_APPROVAL to AWAITING_PAYMENT)
  async approveContract(contractId: string, clientId: string) {
    return this.dataSource.transaction(async (manager) => {
      const contract = await manager.findOne(Contract, {
        where: { id: contractId, clientId },
        relations: ["proposal"],
      });

      if (!contract) throw new NotFoundException("Contract not found");
      if (contract.status !== ContractStatus.PENDING_CLIENT_APPROVAL)
        throw new BadRequestException("Only pending contracts can be approved");

      // Check if there's already an active contract for this proposal (excluding current contract)
      if (contract.proposalId) {
        const existingContract = await manager
          .createQueryBuilder(Contract, "contract")
          .where("contract.proposalId = :proposalId", {
            proposalId: contract.proposalId,
          })
          .andWhere("contract.status = :status", {
            status: ContractStatus.AWAITING_PAYMENT,
          })
          .andWhere("contract.id != :contractId", { contractId })
          .getOne();

        if (existingContract)
          throw new BadRequestException(
            "A contract for this proposal is already awaiting payment. You cannot approve another contract.",
          );
      }

      // Update contract status
      contract.status = ContractStatus.AWAITING_PAYMENT;
      await manager.save(contract);

      // Mark proposal as HIRED
      if (contract.proposal) {
        contract.proposal.status = ProposalStatus.HIRED;
        await manager.save(contract.proposal);
      }

      return contract;
    });
  }

  async addMilestone(contractId: string, title: string, amount: number) {
    const c = await this.contractRepo.findOne({ where: { id: contractId } });
    if (!c) throw new NotFoundException("Contract not found");
    const m = new (require("../../entities/milestone.entity").Milestone)();
    m.title = title;
    m.amount = amount;
    m.contract = c;
    return await this.contractRepo.manager.save(m);
  }

  // ✅ Create contract directly from proposal (no bid required)
  async createFromProposal(
    client: User,
    freelancer: User,
    proposal: Proposal,
    amount: number,
    currency: string = "ngn",
  ) {
    // Check if there's already an active contract for this proposal
    const existingContract = await this.contractRepo.findOne({
      where: {
        proposalId: proposal.id,
        status: ContractStatus.AWAITING_PAYMENT,
      },
    });

    if (existingContract)
      throw new BadRequestException(
        "A contract for this proposal is already awaiting payment. You cannot create another contract.",
      );

    const contract = this.contractRepo.create({
      proposal,
      // No bid reference since this is direct acceptance
      client,
      freelancer,
      amount,
      currency,
      durationDays: proposal.durationEstimateDays, // From proposal
      rateType: BidRateType.FIXED, // Default to FIXED for direct acceptance
      status: ContractStatus.AWAITING_PAYMENT,
    });
    return this.contractRepo.save(contract);
  }

  // ✅ Get count of active contracts for freelancer (active or awaiting_payment)
  async countActiveContractsForFreelancer(
    freelancerId: string,
  ): Promise<number> {
    return this.contractRepo.count({
      where: [
        { freelancerId, status: ContractStatus.ACTIVE },
        { freelancerId, status: ContractStatus.AWAITING_PAYMENT },
      ],
    });
  }

  // ✅ Get count of completed contracts for freelancer
  async countCompletedContractsForFreelancer(
    freelancerId: string,
  ): Promise<number> {
    return this.contractRepo.count({
      where: {
        freelancerId,
        status: ContractStatus.COMPLETED,
      },
    });
  }

  // ✅ Get total revenue from completed contracts and completed milestones for freelancer
  async getTotalRevenueForFreelancer(freelancerId: string): Promise<number> {
    // Get revenue from completed contracts (full payment contracts)
    const completedContractsResult = await this.contractRepo
      .createQueryBuilder("contract")
      .select("COALESCE(SUM(contract.amount), 0)", "total")
      .where("contract.freelancerId = :freelancerId", { freelancerId })
      .andWhere("contract.status = :status", {
        status: ContractStatus.COMPLETED,
      })
      .getRawOne();

    const completedContractsRevenue = parseInt(
      completedContractsResult?.total || "0",
      10,
    );

    // Get revenue from completed milestones (milestone-based contracts)
    const completedMilestonesResult = await this.milestoneRepo
      .createQueryBuilder("milestone")
      .innerJoin("milestone.contract", "contract")
      .select("COALESCE(SUM(milestone.amount), 0)", "total")
      .where("contract.freelancerId = :freelancerId", { freelancerId })
      .andWhere("milestone.status = :status", {
        status: MilestoneStatus.COMPLETED,
      })
      .andWhere("milestone.parentId IS NOT NULL") // Only count child milestones
      .getRawOne();

    const completedMilestonesRevenue = parseInt(
      completedMilestonesResult?.total || "0",
      10,
    );

    return completedContractsRevenue + completedMilestonesRevenue;
  }

  // ✅ Get contracts for freelancer by status
  async findByFreelancer(
    freelancerId: string,
    status?: ContractStatus,
  ): Promise<Contract[]> {
    const where: any = { freelancerId };
    if (status) {
      where.status = status;
    }

    return this.contractRepo.find({
      where,
      relations: [
        "client",
        "proposal",
        "proposal.skills",
        "proposal.categories",
        "bid",
      ],
      order: { createdAt: "DESC" },
    });
  }

  // ✅ Get active contracts for freelancer (active or awaiting_payment)
  async findActiveContractsForFreelancer(
    freelancerId: string,
    page?: number,
    limit?: number,
  ): Promise<Contract[]> {
    const queryBuilder = this.contractRepo
      .createQueryBuilder("contract")
      .where("contract.freelancer_id = :freelancerId", { freelancerId })
      .andWhere("contract.user_status IN (:...statuses)", {
        statuses: [
          ContractStatus.ACTIVE,
          ContractStatus.AWAITING_PAYMENT,
          ContractStatus.SUBMITTED,
          // ContractStatus.COMPLETED,
        ],
      })
      .leftJoinAndSelect("contract.client", "client")
      .leftJoinAndSelect("contract.proposal", "proposal")
      .leftJoinAndSelect("proposal.skills", "proposalSkills")
      .leftJoinAndSelect("proposal.categories", "proposalCategories")
      .leftJoinAndSelect("contract.bid", "bid")
      .leftJoinAndSelect("contract.milestones", "milestones")
      .leftJoinAndSelect("milestones.deliverables", "milestonesDeliverables")
      .orderBy("contract.created_at", "DESC");

    if (limit !== undefined) {
      queryBuilder.limit(limit);
      if (page !== undefined && page > 0) {
        queryBuilder.offset((page - 1) * limit);
      }
    }

    return queryBuilder.getMany();
  }

  // ✅ Get completed contracts for freelancer
  async findCompletedContractsForFreelancer(
    freelancerId: string,
  ): Promise<Contract[]> {
    return this.contractRepo.find({
      where: { freelancerId, status: ContractStatus.COMPLETED },
      relations: [
        "client",
        "proposal",
        "proposal.skills",
        "proposal.categories",
        "bid",
      ],
      order: { createdAt: "DESC" },
    });
  }

  // ✅ Get active contracts for client (active, awaiting_payment, or payment_initiated)
  async findActiveContractsForClient(clientId: string): Promise<Contract[]> {
    return this.contractRepo.find({
      where: [
        { clientId, status: ContractStatus.ACTIVE },
        { clientId, status: ContractStatus.AWAITING_PAYMENT },
        { clientId, status: ContractStatus.PAYMENT_INITIATED },
      ],
      relations: [
        "client",
        "freelancer",
        "proposal",
        "proposal.skills",
        "proposal.categories",
        "bid",
      ],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Client dashboard stats: amount spent (completed contracts + released/completed milestones) and active hires count.
   */
  async getClientDashboardStats(clientId: string): Promise<{
    amountSpent: number;
    activeContractsCount: number;
  }> {
    const [amountSpentResult, activeCount] = await Promise.all([
      this.getClientAmountSpent(clientId),
      this.contractRepo.count({
        where: [
          { clientId, status: ContractStatus.ACTIVE },
          { clientId, status: ContractStatus.AWAITING_PAYMENT },
          { clientId, status: ContractStatus.PAYMENT_INITIATED },
        ],
      }),
    ]);

    return {
      amountSpent: amountSpentResult,
      activeContractsCount: activeCount,
    };
  }

  private async getClientAmountSpent(clientId: string): Promise<number> {
    const completedContractSum = await this.contractRepo
      .createQueryBuilder("c")
      .select("COALESCE(SUM(c.amount), 0)", "total")
      .where("c.client_id = :clientId", { clientId })
      .andWhere("c.user_status = :status", {
        status: ContractStatus.COMPLETED,
      })
      .getRawOne<{ total: string }>();

    const releasedMilestonesSum = await this.milestoneRepo
      .createQueryBuilder("m")
      .innerJoin("m.contract", "c")
      .select("COALESCE(SUM(m.amount), 0)", "total")
      .where("c.client_id = :clientId", { clientId })
      .andWhere("m.user_status IN (:...statuses)", {
        statuses: [MilestoneStatus.COMPLETED, MilestoneStatus.RELEASED],
      })
      .getRawOne<{ total: string }>();

    const fromContracts = Number(completedContractSum?.total ?? 0);
    const fromMilestones = Number(releasedMilestonesSum?.total ?? 0);
    return fromContracts + fromMilestones;
  }

  /**
   * Activate contract after payment is escrowed
   * Updates contract status from AWAITING_PAYMENT to ACTIVE
   */
  async activateContractAfterPayment(contractId: string): Promise<Contract> {
    return this.dataSource.transaction(async (manager) => {
      const contract = await manager.findOne(Contract, {
        where: { id: contractId },
      });

      if (!contract) {
        throw new NotFoundException("Contract not found");
      }

      if (contract.status !== ContractStatus.AWAITING_PAYMENT) {
        throw new BadRequestException(
          `Contract must be in AWAITING_PAYMENT status to activate. Current status: ${contract.status}`,
        );
      }

      contract.status = ContractStatus.ACTIVE;
      return await manager.save(contract);
    });
  }

  /**
   * Check if all milestones are released and mark contract as completed
   * Only checks contracts that are currently ACTIVE
   * For milestone-based contracts: checks if all child milestones are released
   * For full payment contracts: checks if payment is escrowed (no milestones needed)
   */
  async checkAndCompleteContract(contractId: string): Promise<Contract | null> {
    return this.dataSource.transaction(async (manager) => {
      const contract = await manager.findOne(Contract, {
        where: { id: contractId },
      });

      if (!contract) {
        throw new NotFoundException("Contract not found");
      }

      // Only check active contracts
      if (contract.status !== ContractStatus.ACTIVE) {
        return null; // Contract is not active, no need to check
      }

      // Get all milestones for this contract
      const allMilestones = await manager.find(Milestone, {
        where: { contractId: contract.id },
      });

      // If no milestones exist, contract completion is handled elsewhere
      // (e.g., based on payment status or manual completion)
      if (allMilestones.length === 0) {
        return null;
      }

      // Find parent milestones
      const parentMilestones = allMilestones.filter((m) => !m.parentId);

      // If there are parent milestones, check child milestones
      if (parentMilestones.length > 0) {
        // Get all child milestones (milestones with a parentId)
        const childMilestones = allMilestones.filter((m) => !!m.parentId);

        // If there are child milestones, check if all are completed
        if (childMilestones.length > 0) {
          const allMilestonesCompleted = childMilestones.every(
            (milestone) => milestone.status === MilestoneStatus.COMPLETED,
          );

          if (allMilestonesCompleted) {
            // Release any remaining escrowed payments to freelancer wallet
            await this.releaseContractPayments(
              manager,
              contract.id,
              contract.freelancerId,
              contract.currency || "ngn",
            );

            contract.status = ContractStatus.COMPLETED;
            return await manager.save(contract);
          }
        }
      } else {
        // No parent milestones - check if all milestones are completed
        // (for contracts created before parent-child structure)
        const allMilestonesCompleted = allMilestones.every(
          (milestone) => milestone.status === MilestoneStatus.COMPLETED,
        );

        if (allMilestonesCompleted) {
          // Release any remaining escrowed payments to freelancer wallet
          // await this.releaseContractPayments(
          //   manager,
          //   contract.id,
          //   contract.freelancerId,
          //   contract.currency || "ngn",
          // );

          // Just update the contract status to completed since payments will be released in the milestones

          contract.status = ContractStatus.COMPLETED;
          return await manager.save(contract);
        }
      }

      return null; // Not all milestones are completed yet
    });
  }

  // Helper method to release escrowed payments to freelancer wallet
  private async releaseContractPayments(
    manager: EntityManager,
    contractId: string,
    freelancerId: string,
    currency: string,
  ): Promise<void> {
    // Find all escrowed payments for this contract
    const escrowedPayments = await manager.find(Payment, {
      where: {
        contractId,
        status: PaymentStatus.ESCROWED,
      },
    });

    if (escrowedPayments.length === 0) {
      return; // No escrowed payments to release
    }

    // Filter payments that are full payment mode (not milestone-specific)
    // For milestone contracts, payments are already released when milestones are approved
    const fullPayments = escrowedPayments.filter((payment: Payment) => {
      const paymentMode =
        payment.providerRaw?.metadata?.paymentMode ||
        payment.providerRaw?.paymentMode;

      // Release full payments or payments without milestoneId
      return (
        paymentMode === "full" ||
        !payment.providerRaw?.metadata?.milestoneId ||
        !payment.providerRaw?.milestoneId
      );
    });

    if (fullPayments.length === 0) {
      return; // No full payments to release
    }

    // Calculate total amount to release
    const totalAmount = fullPayments.reduce(
      (sum: number, payment: Payment) => sum + payment.amount,
      0,
    );

    if (totalAmount === 0) {
      return; // No amount to release
    }

    // Get or create freelancer wallet
    let wallet = await manager.findOne(Wallet, {
      where: { userId: freelancerId },
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = manager.create(Wallet, {
        userId: freelancerId,
        balance: 0,
        currency,
      });
      wallet = await manager.save(wallet);
    }

    // Credit freelancer wallet
    wallet.balance = Number(wallet.balance) + totalAmount;
    await manager.save(wallet);

    // Get contract and freelancer for transaction creation
    const contract = await manager.findOne(Contract, {
      where: { id: contractId },
      relations: ["freelancer", "client"],
    });

    if (!contract)
      throw new BadRequestException(
        "Cannot find contract for payment you're trying to release.",
      );

    const freelancer = contract.freelancer;
    const client = contract.client;

    // Update payment statuses to RELEASED and create transactions
    for (const payment of fullPayments) {
      payment.status = PaymentStatus.RELEASED;
      await manager.save(payment);

      // Create transaction records for freelancer (full contract payment)
      if (freelancer && contract) {
        // For full contract payments, create transactions without milestone
        await this.transactionService.createTransaction(
          {
            userId: client.id,
            type: TransactionType.RELEASED,
            amount: payment.amount,
            currency: payment.currency,
            description: `Payment released for contract: ${contract.id}`,
            contractId: contract.id,
            paymentId: payment.id,
            walletId: wallet.id,
            metadata: {
              paymentMode: "full",
              providerPaymentId: payment.providerPaymentId,
            },
            status: TransactionStatus.COMPLETED,
          },
          manager,
        );
        await this.transactionService.createTransaction(
          {
            userId: freelancer.id,
            type: TransactionType.PAYMENT_RECEIVED,
            amount: payment.amount,
            currency: payment.currency,
            description: `Payment received for contract: ${contract.id}`,
            contractId: contract.id,
            paymentId: payment.id,
            walletId: wallet.id,
            metadata: {
              paymentMode: "full",
              providerPaymentId: payment.providerPaymentId,
            },
            status: TransactionStatus.COMPLETED,
          },
          manager,
        );
      }
    }
  }

  /**
   * Submit a full contract for client review
   * Only works for full contracts (no child milestones) that are active
   */
  async submitContract(
    freelancer: User,
    contractId: string,
    dto: SubmitContractDto,
    files: Express.Multer.File[] = [],
  ): Promise<Contract> {
    return this.dataSource.transaction(async (manager) => {
      // Find contract with relations
      const contract = await manager.findOne(Contract, {
        where: { id: contractId },
        relations: ["freelancer", "milestones"],
      });

      if (!contract) {
        throw new NotFoundException("Contract not found");
      }

      // Verify contract belongs to freelancer
      if (contract.freelancerId !== freelancer.id) {
        throw new ForbiddenException(
          "You can only submit contracts assigned to you",
        );
      }

      // Verify contract is active
      if (contract.status !== ContractStatus.ACTIVE) {
        throw new BadRequestException(
          `Contract must be ACTIVE to submit. Current status: ${contract.status}`,
        );
      }

      // Verify this is a full contract (no child milestones)
      const childMilestones =
        contract.milestones?.filter((m) => m.parentId) || [];
      if (childMilestones.length > 0) {
        throw new BadRequestException(
          "Cannot submit milestone-based contracts. Use milestone submission instead.",
        );
      }

      // Upload files to Cloudinary if any
      let attachments:
        | Array<{
            id: string;
            name: string;
            type: "image" | "video" | "document" | "other";
            size: number;
            url: string;
          }>
        | undefined;

      if (files && files.length > 0) {
        const uploadResults = await this.cloudinaryService.uploadMultipleFiles(
          files,
          `contracts/${contractId}/submissions`,
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

      // Update contract with submission data and change status to SUBMITTED
      contract.submissionDescription = dto.description;
      contract.submissionLinks = submissionLinks;
      contract.submissionAttachments = attachments;
      contract.status = ContractStatus.SUBMITTED;

      return await manager.save(contract);
    });
  }

  /**
   * Approve a submitted full contract
   * Releases escrowed payment to freelancer and marks contract as completed
   */
  async approveContractSubmission(
    contractId: string,
    clientId: string,
  ): Promise<Contract> {
    return this.dataSource.transaction(async (manager) => {
      const contract = await manager.findOne(Contract, {
        where: { id: contractId, clientId },
        relations: ["freelancer", "milestones", "proposal"],
      });

      if (!contract) {
        throw new NotFoundException("Contract not found");
      }

      // Verify contract belongs to client
      if (contract.clientId !== clientId) {
        throw new ForbiddenException(
          "You can only approve contracts assigned to you",
        );
      }

      // Verify contract is submitted
      if (contract.status !== ContractStatus.SUBMITTED) {
        throw new BadRequestException(
          `Contract must be SUBMITTED to approve. Current status: ${contract.status}`,
        );
      }

      // Verify this is a full contract (no child milestones)
      const childMilestones =
        contract.milestones?.filter((m) => m.parentId) || [];
      if (childMilestones.length > 0) {
        throw new BadRequestException(
          "Cannot approve milestone-based contracts. Use milestone approval instead.",
        );
      }

      // Release escrowed payments to freelancer wallet
      await this.releaseContractPayments(
        manager,
        contractId,
        contract.freelancerId,
        contract.currency,
      );

      // Mark Proposal as completed
      if (contract.proposal) {
        contract.proposal.status = ProposalStatus.CLOSED;
        await manager.save(contract.proposal);
      }
      await manager.save(contract.proposal);

      // Mark contract as completed
      contract.status = ContractStatus.COMPLETED;
      return await manager.save(contract);
    });
  }

  /**
   * Reject a submitted full contract
   * Returns contract to active status so freelancer can resubmit
   */
  async rejectContractSubmission(
    contractId: string,
    clientId: string,
    reason?: string,
  ): Promise<Contract> {
    return this.dataSource.transaction(async (manager) => {
      const contract = await manager.findOne(Contract, {
        where: { id: contractId, clientId },
        relations: ["milestones"],
      });

      if (!contract) {
        throw new NotFoundException("Contract not found");
      }

      // Verify contract belongs to client
      if (contract.clientId !== clientId) {
        throw new ForbiddenException(
          "You can only reject contracts assigned to you",
        );
      }

      // Verify contract is submitted
      if (contract.status !== ContractStatus.SUBMITTED) {
        throw new BadRequestException(
          `Contract must be SUBMITTED to reject. Current status: ${contract.status}`,
        );
      }

      // Verify this is a full contract (no child milestones)
      const childMilestones =
        contract.milestones?.filter((m) => m.parentId) || [];
      if (childMilestones.length > 0) {
        throw new BadRequestException(
          "Cannot reject milestone-based contracts. Use milestone rejection instead.",
        );
      }

      // Return contract to active status (freelancer can resubmit)
      // Keep submission data for reference, but allow resubmission
      contract.status = ContractStatus.ACTIVE;
      return await manager.save(contract);
    });
  }
}
