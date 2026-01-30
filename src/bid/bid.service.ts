import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager, In } from "typeorm";
import { Bid, BidStatus, BidRateType } from "../model/bid.entity";
import { Proposal, ProposalStatus } from "../model/proposal.entity";
import { User } from "../model/user.entity";
import { CreateBidDto, AttachmentMetadata } from "./dto/create-bid.dto";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { Contract, ContractStatus } from "../model/contract.entity";

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly manager: EntityManager,
  ) {}

  async create(
    freelancerId: string,
    proposalId: string,
    dto: CreateBidDto,
    files: Express.Multer.File[] = [],
  ) {
    const proposal = await this.proposalRepo.findOne({
      where: { id: proposalId },
    });
    if (!proposal) throw new NotFoundException("Proposal not found");
    if (proposal.status !== "open")
      throw new BadRequestException("This proposal is no longer open.");

    // Upload files to Cloudinary if any
    let attachments: AttachmentMetadata[] | undefined;
    if (files && files.length > 0) {
      const uploadResults = await this.cloudinaryService.uploadMultipleFiles(
        files,
        `bids/${proposalId}`,
      );

      attachments = uploadResults.map((result, index) => {
        const file = files[index];
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

        return {
          id: result.public_id,
          name: file.originalname,
          type: getFileType(file.mimetype),
          size: result.bytes,
          url: result.secure_url,
        };
      });
    }

    const bid = this.bidRepo.create({
      freelancerId,
      proposalId,
      title: dto.title,
      coverLetter: dto.coverLetter,
      proposedBudget: dto.proposedBudget,
      rateType: dto.rateType || BidRateType.FIXED,
      proposedDurationDays: dto.proposedDurationDays,
      experience: dto.experience,
      portfolio: dto.portfolio,
      attachments,
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
      relations: ["freelancer", "freelancer.freelancerProfile"],
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

  // ✅ Get all active bids for a client (bids that haven't been accepted)
  async findActiveBidsForClient(clientId: string) {
    return this.bidRepo.find({
      where: {
        proposal: { clientId },
        status: BidStatus.PENDING,
      },
      relations: ["proposal", "freelancer"],
      order: { createdAt: "DESC" },
    });
  }

  // ✅ Get all bids for client responses (excluding proposals with active contracts)
  async findResponsesBidsForClient(clientId: string) {
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

    // Get all bids for proposals without active contracts
    return this.bidRepo.find({
      where: {
        proposalId: In(proposalsWithoutActiveContracts),
      },
      relations: ["proposal", "freelancer", "freelancer.freelancerProfile"],
      order: { createdAt: "DESC" },
    });
  }

  // ✅ Get all bids for a freelancer
  async findByFreelancer(freelancerId: string) {
    return this.bidRepo.find({
      where: { freelancerId, status: BidStatus.PENDING },
      relations: [
        "proposal",
        "proposal.client",
        "proposal.skills",
        "proposal.categories",
      ],
      order: { createdAt: "DESC" },
    });
  }

  // ✅ Get count of active (pending) bids for freelancer
  async countActiveBidsForFreelancer(freelancerId: string): Promise<number> {
    return this.bidRepo.count({
      where: {
        freelancerId,
        status: BidStatus.PENDING,
      },
    });
  }

  // ✅ Update a bid
  async update(
    bidId: string,
    freelancerId: string,
    dto: Partial<CreateBidDto>,
    files: Express.Multer.File[] = [],
  ) {
    const bid = await this.bidRepo.findOne({
      where: { id: bidId, freelancerId },
      relations: ["proposal"],
    });

    if (!bid) throw new NotFoundException("Bid not found");
    if (bid.status !== BidStatus.PENDING)
      throw new BadRequestException("Only pending bids can be updated");
    if (bid.proposal.status !== ProposalStatus.OPEN)
      throw new BadRequestException("Cannot update bid for closed proposal");

    // Handle file uploads if any
    let attachments = bid.attachments || [];
    if (files && files.length > 0) {
      const uploadResults = await this.cloudinaryService.uploadMultipleFiles(
        files,
        `bids/${bid.proposalId}`,
      );

      const newAttachments = uploadResults.map((result, index) => {
        const file = files[index];
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

        return {
          id: result.public_id,
          name: file.originalname,
          type: getFileType(file.mimetype),
          size: result.bytes,
          url: result.secure_url,
        };
      });

      // Merge with existing attachments
      attachments = [...attachments, ...newAttachments];
    }

    // Update bid fields
    if (dto.title !== undefined) bid.title = dto.title;
    if (dto.coverLetter !== undefined) bid.coverLetter = dto.coverLetter;
    if (dto.proposedBudget !== undefined)
      bid.proposedBudget = dto.proposedBudget;
    if (dto.rateType !== undefined) bid.rateType = dto.rateType;
    if (dto.proposedDurationDays !== undefined)
      bid.proposedDurationDays = dto.proposedDurationDays;
    if (dto.experience !== undefined) bid.experience = dto.experience;
    if (dto.portfolio !== undefined) bid.portfolio = dto.portfolio;
    if (attachments.length > 0) bid.attachments = attachments;

    return this.bidRepo.save(bid);
  }

  // ✅ Hire freelancer: Accept bid and create contract in single transaction
  async hireFreelancer(
    client: User,
    bidId: string,
    contractAmount: number,
    currency: string = "ngn",
  ) {
    return this.manager.transaction(async (transactionalManager) => {
      // Find bid with relations
      const bid = await transactionalManager.findOne(Bid, {
        where: { id: bidId },
        relations: ["proposal", "proposal.client", "freelancer"],
      });

      if (!bid) throw new NotFoundException("Bid not found");
      if (bid.proposal.client.id !== client.id)
        throw new ForbiddenException(
          "You can only hire from your own proposals",
        );
      if (bid.status !== BidStatus.PENDING)
        throw new BadRequestException("Bid must be pending to hire");

      // Check if there's already an active contract for this proposal
      const existingContract = await transactionalManager.findOne(Contract, {
        where: {
          proposalId: bid.proposalId,
          status: ContractStatus.AWAITING_PAYMENT,
        },
      });

      if (existingContract)
        throw new BadRequestException(
          "A contract for this proposal is already awaiting payment. You cannot hire another freelancer.",
        );

      // Accept the bid
      bid.status = BidStatus.ACCEPTED;
      await transactionalManager.save(bid);

      // Create contract with bid details (duration, rateType)
      const contract = transactionalManager.create(Contract, {
        proposal: bid.proposal, // Set the proposal since it's already set in the bid
        bid, // Link to the bid
        client,
        freelancer: bid.freelancer,
        amount: contractAmount,
        currency,
        durationDays: bid.proposedDurationDays, // From bid
        rateType: bid.rateType, // From bid
        status: ContractStatus.AWAITING_PAYMENT,
      });
      const savedContract = await transactionalManager.save(contract);

      // Update proposal status
      bid.proposal.status = ProposalStatus.HIRED;
      await transactionalManager.save(bid.proposal);

      return savedContract;
    });
  }
}
