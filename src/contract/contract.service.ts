import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Contract, ContractStatus } from "../model/contract.entity";
import { Bid, BidStatus } from "../model/bid.entity";
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
        proposal: bid.proposal,
        client,
        freelancer: bid.freelancer,
        amount: dto.amount,
        currency: dto.currency || "ngn",
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

  async addMilestone(contractId: string, title: string, amount: number) {
    const c = await this.contractRepo.findOne({ where: { id: contractId } });
    if (!c) throw new NotFoundException("Contract not found");
    const m = new (require("../../entities/milestone.entity").Milestone)();
    m.title = title;
    m.amount = amount;
    m.contract = c;
    return await this.contractRepo.manager.save(m);
  }
}
