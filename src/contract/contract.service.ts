import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Contract, ContractStatus } from "../model/contract.entity";
import { Bid, BidStatus, BidRateType } from "../model/bid.entity";
import { CreateContractDto } from "./dto/create-contract.dto";
import { User } from "../model/user.entity";
import { Proposal, ProposalStatus } from "../model/proposal.entity";

@Injectable()
export class ContractService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
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
        // proposal: bid.proposal, - No need to set proposal since it's already set in the bid
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
      relations: ["freelancer", "proposal"],
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
        throw new BadRequestException(
          "Only pending contracts can be approved",
        );

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
}
