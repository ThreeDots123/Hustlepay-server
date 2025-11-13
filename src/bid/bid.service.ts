import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Bid, BidStatus } from "../model/bid.entity";
import { Proposal, ProposalStatus } from "../model/proposal.entity";
import { User } from "../model/user.entity";
import { CreateBidDto } from "./dto/create-bid.dto";

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
  ) {}

  async create(freelancerId: string, proposalId: string, dto: CreateBidDto) {
    const proposal = await this.proposalRepo.findOne({
      where: { id: proposalId },
    });
    if (!proposal) throw new NotFoundException("Proposal not found");
    if (proposal.status !== "open")
      throw new BadRequestException("Proposal not open");

    const bid = this.bidRepo.create({
      freelancerId,
      proposalId,
      coverLetter: dto.coverLetter,
      proposedBudget: dto.proposedBudget,
      proposedDurationDays: dto.proposedDurationDays,
    });
    return this.bidRepo.save(bid);
  }

  // ✅ Get all bids for a proposal
  async findByProposal(proposalId: string, clientId: string) {
    const proposal = await this.proposalRepo.findOne({
      where: { id: proposalId, clientId },
    });

    if (!proposal) throw new NotFoundException("Proposal not found");

    return this.bidRepo.find({
      where: { proposal: { id: proposalId } },
      relations: ["freelancer"],
      order: { createdAt: "DESC" },
    });
  }

  // ✅ Get a single bid by ID
  async findOne(
    bidId: string,
    proposalId: string,
    opts: { clientId?: string; freelancerId?: string },
  ) {
    const { clientId, freelancerId } = opts;

    const bid = await this.bidRepo.findOne({
      where: {
        id: bidId,
        ...(clientId
          ? { proposal: { id: proposalId, clientId } }
          : { freelancerId }),
      },
      relations: [
        "proposal",
        "freelancer",
        // "freelancer.profile",
        // "freelancer.profile.skills",
      ],
    });

    if (!bid) throw new NotFoundException("Bid not found");

    // Authorization: only the freelancer who made it OR the client of the proposal can view
    // if (bid.freelancer.id !== user.id && bid.proposal.client.id !== user.id) {
    //   throw new ForbiddenException("Access denied");
    // }

    return bid;
  }

  async withdraw(freelancer: User, bidId: string) {
    const bid = await this.bidRepo.findOne({
      where: { id: bidId },
      relations: ["freelancer"],
    });
    if (!bid) throw new NotFoundException("Bid not found");
    if (bid.freelancer.id !== freelancer.id) throw new ForbiddenException();
    bid.status = BidStatus.WITHDRAWN;
    return this.bidRepo.save(bid);
  }

  async accept(client: User, bidId: string) {
    const bid = await this.bidRepo.findOne({
      where: { id: bidId },
      relations: ["proposal", "proposal.client", "freelancer"],
    });
    if (!bid) throw new NotFoundException("Bid not found");
    if (bid.proposal.client.id !== client.id) throw new ForbiddenException();
    if (bid.status !== BidStatus.PENDING)
      throw new BadRequestException("Bid cannot be accepted");
    bid.status = BidStatus.ACCEPTED;
    await this.bidRepo.save(bid);
    // mark proposal hired
    bid.proposal.status = ProposalStatus.HIRED;
    await this.proposalRepo.save(bid.proposal);
    return bid;
  }
}
