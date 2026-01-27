import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { Contract, ContractStatus } from "../model/contract.entity";
import { Bid, BidStatus, BidRateType } from "../model/bid.entity";
import { CreateContractDto } from "./dto/create-contract.dto";
import { User } from "../model/user.entity";
import { Proposal, ProposalStatus } from "../model/proposal.entity";
import { Milestone, MilestoneStatus } from "../model/milestone.entity";

@Injectable()
export class ContractService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
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

  // ✅ Get total revenue from completed contracts for freelancer
  async getTotalRevenueForFreelancer(freelancerId: string): Promise<number> {
    const result = await this.contractRepo
      .createQueryBuilder("contract")
      .select("COALESCE(SUM(contract.amount), 0)", "total")
      .where("contract.freelancerId = :freelancerId", { freelancerId })
      .andWhere("contract.status = :status", {
        status: ContractStatus.COMPLETED,
      })
      .getRawOne();

    return parseInt(result?.total || "0", 10);
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
  ): Promise<Contract[]> {
    return this.contractRepo.find({
      where: [
        { freelancerId, status: ContractStatus.ACTIVE },
        { freelancerId, status: ContractStatus.AWAITING_PAYMENT },
      ],
      relations: [
        "client",
        "proposal",
        "proposal.skills",
        "proposal.categories",
        "bid",
        "milestones",
        "milestones.deliverables",
        // "milestones.children",
      ],
      order: { createdAt: "DESC" },
    });
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

        // If there are child milestones, check if all are released
        if (childMilestones.length > 0) {
          const allMilestonesReleased = childMilestones.every(
            (milestone) => milestone.status === MilestoneStatus.RELEASED,
          );

          if (allMilestonesReleased) {
            contract.status = ContractStatus.COMPLETED;
            return await manager.save(contract);
          }
        }
      } else {
        // No parent milestones - check if all milestones are released
        // (for contracts created before parent-child structure)
        const allMilestonesReleased = allMilestones.every(
          (milestone) => milestone.status === MilestoneStatus.RELEASED,
        );

        if (allMilestonesReleased) {
          contract.status = ContractStatus.COMPLETED;
          return await manager.save(contract);
        }
      }

      return null; // Not all milestones are released yet
    });
  }
}
