import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Bid, BidStatus, BidRateType } from "../model/bid.entity";
import { Proposal, ProposalStatus } from "../model/proposal.entity";
import { User } from "../model/user.entity";
import { CreateBidDto, AttachmentMetadata } from "./dto/create-bid.dto";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    private readonly cloudinaryService: CloudinaryService,
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
      throw new BadRequestException("Proposal not open");

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
}
