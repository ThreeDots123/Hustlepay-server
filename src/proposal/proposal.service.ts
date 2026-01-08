import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository, EntityManager } from "typeorm";
import { Proposal, ProposalStatus } from "../model/proposal.entity";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { UpdateProposalDto } from "./dto/update-proposal.dto";
import { User as UserEntity } from "../model/user.entity";
import { SkillCatalog as SkillCatalogEntity } from "../model/skill-catalog.entity";
import { CategoryCatalog as CategoryCatalogEntity } from "../model/category-catalog.entity";
import { Bid, BidRateType } from "src/model/bid.entity";
import { Contract, ContractStatus } from "../model/contract.entity";

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    @InjectRepository(SkillCatalogEntity)
    private readonly skillRepo: Repository<SkillCatalogEntity>,
    @InjectRepository(CategoryCatalogEntity)
    private readonly categoryRepo: Repository<CategoryCatalogEntity>,
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    private readonly manager: EntityManager,
  ) {}

  async create(clientId: string, dto: CreateProposalDto) {
    const skills: SkillCatalogEntity[] = [];
    if (dto.skills && dto.skills.length) {
      for (const s of dto.skills) {
        let skill = await this.skillRepo.findOne({ where: { name: s } });
        if (!skill) {
          skill = this.skillRepo.create({ name: s });
          await this.skillRepo.save(skill);
        }
        skills.push(skill);
      }
    }

    const categories: CategoryCatalogEntity[] = [];
    if (dto.categories && dto.categories.length) {
      for (const c of dto.categories) {
        let category = await this.categoryRepo.findOne({ where: { name: c } });
        if (!category) {
          category = this.categoryRepo.create({ name: c });
          await this.categoryRepo.save(category);
        }
        categories.push(category);
      }
    }

    const p = this.proposalRepo.create({
      title: dto.title,
      description: dto.description,
      ...(dto.descriptionTree && { descriptionTree: dto.descriptionTree }),
      clientId,
      budgetMin: dto.budgetMin,
      budgetMax: dto.budgetMax,
      durationEstimateDays: dto.durationEstimateDays,
      skills,
      categories,
    });

    const savedProposal = await this.proposalRepo.save(p);

    // await this.notifications.emitToAdmins('proposal.created', { proposalId: saved.id });
    console.log("Notification to admins: proposal.created", {
      proposalId: savedProposal.id,
    });
    return savedProposal;
  }

  async findOne(
    slug: string,
    user: { freelancer: string } | { client: string },
  ) {
    if ("freelancer" in user) {
      const p = await this.proposalRepo.findOne({
        where: { slug },
        relations: ["client", "skills", "categories", "bids"],
      });
      if (!p) throw new NotFoundException("Proposal not found");

      const alreadyBidded = await this.bidRepo.exists({
        where: { freelancerId: user.freelancer, proposalId: p.id },
      });
      return { proposal: p, alreadyBidded };
    }

    // Client case
    if ("client" in user) {
      const p = await this.proposalRepo.findOne({
        where: { slug, clientId: user.client },
        relations: ["client", "skills", "categories", "bids"],
      });
      if (!p) throw new NotFoundException("Proposal not found");
      return p;
    }

    throw new ForbiddenException("Invalid user type");
  }

  async findAll(
    {
      page = 1,
      limit = 20,
      skill,
      skills,
      budgetMin,
      budgetMax,
      durationMin,
      durationMax,
      inviteOnly,
      categories,
      query,
    }: {
      page?: number;
      limit?: number;
      skill?: string;
      skills?: string[];
      budgetMin?: number;
      budgetMax?: number;
      durationMin?: number;
      durationMax?: number;
      inviteOnly?: boolean;
      categories?: string[];
      query?: string;
    },
    clientId?: string,
  ) {
    const qb = this.proposalRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.skills", "s")
      .leftJoinAndSelect("p.categories", "c")
      .distinct(true);

    if (clientId) qb.andWhere("p.clientId = :clientId", { clientId });
    else {
      qb.leftJoinAndSelect("p.client", "client");
      // Only show proposals that are not closed
      qb.where("p.status != :status", { status: ProposalStatus.CLOSED });
    }

    // Search query - search in title, description, skills, and categories
    if (query && query.trim()) {
      qb.andWhere(
        "(LOWER(p.title) LIKE LOWER(:query) OR LOWER(p.description) LIKE LOWER(:query) OR LOWER(s.name) LIKE LOWER(:query) OR LOWER(c.name) LIKE LOWER(:query))",
        { query: `%${query.trim()}%` },
      );
    }

    // Filter by skills (prioritize skills array over single skill)
    if (skills && skills.length > 0) {
      qb.andWhere("s.name IN (:...skills)", { skills });
    } else if (skill) {
      // Filter by single skill (for backward compatibility)
      qb.andWhere("s.name = :skill", { skill });
    }

    // Filter by proposal categories
    if (categories && categories.length > 0) {
      qb.andWhere("c.name IN (:...categories)", { categories });
    }

    // Filter by budget range
    if (budgetMin !== undefined && budgetMin !== null) {
      qb.andWhere("p.budgetMin >= :budgetMin", { budgetMin });
    }

    if (budgetMax !== undefined && budgetMax !== null) {
      qb.andWhere("p.budgetMax <= :budgetMax", { budgetMax });
    }

    // Filter by duration range
    if (durationMin !== undefined && durationMin !== null) {
      qb.andWhere("p.durationEstimateDays >= :durationMin", { durationMin });
    }

    if (durationMax !== undefined && durationMax !== null) {
      qb.andWhere("p.durationEstimateDays <= :durationMax", { durationMax });
    }

    // Filter by invite only
    if (inviteOnly !== undefined && inviteOnly !== null) {
      qb.andWhere("p.inviteOnly = :inviteOnly", { inviteOnly });
    }

    qb.orderBy("p.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async update(id: string, clientId: string, dto: UpdateProposalDto) {
    const p = await this.proposalRepo.findOne({
      where: { id, clientId },
    });
    if (!p) throw new NotFoundException("Proposal not found");
    Object.assign(p, dto);
    return this.proposalRepo.save(p);
  }

  async close(id: string, owner: UserEntity) {
    const p = await this.proposalRepo.findOne({
      where: { id },
      relations: ["client"],
    });
    if (!p) throw new NotFoundException("Proposal not found");
    if (p.client.id !== owner.id) throw new ForbiddenException();
    p.status = ProposalStatus.CLOSED;
    return this.proposalRepo.save(p);
  }

  async suggestSkills(query: string, limit = 5) {
    if (!query || query.trim() === "") return [];

    // Use ILike for case-insensitive partial matching
    return this.skillRepo.find({
      where: { name: ILike(`%${query}%`) },
      take: limit,
      order: { name: "ASC" },
    });
  }

  // ✅ Accept proposal directly (freelancer accepts without bidding)
  async acceptProposal(
    freelancer: UserEntity,
    proposalId: string,
    contractAmount?: number,
    currency?: string,
  ) {
    return this.manager.transaction(async (transactionalManager) => {
      // Find proposal with client relation
      const proposal = await transactionalManager.findOne(Proposal, {
        where: { id: proposalId },
        relations: ["client"],
      });

      if (!proposal) throw new NotFoundException("Proposal not found");

      if (proposal.status === ProposalStatus.HIRED)
        throw new BadRequestException("Proposal has already been hired");

      if (proposal.status !== ProposalStatus.OPEN)
        throw new BadRequestException("Proposal must be open to accept");

      // Determine contract amount
      let finalAmount: number;
      if (contractAmount !== undefined && contractAmount !== null) {
        finalAmount = contractAmount;
        // Validate amount is within budget range if range exists
        if (proposal.budgetMin && proposal.budgetMax) {
          if (
            finalAmount < proposal.budgetMin ||
            finalAmount > proposal.budgetMax
          ) {
            throw new BadRequestException(
              `Contract amount must be between ${proposal.budgetMin} and ${proposal.budgetMax}`,
            );
          }
        } else if (proposal.budgetMin && finalAmount < proposal.budgetMin) {
          throw new BadRequestException(
            `Contract amount must be at least ${proposal.budgetMin}`,
          );
        } else if (proposal.budgetMax && finalAmount > proposal.budgetMax) {
          throw new BadRequestException(
            `Contract amount must be at most ${proposal.budgetMax}`,
          );
        }
      } else {
        // Use proposal's budget
        if (proposal.budgetMin === proposal.budgetMax && proposal.budgetMin) {
          finalAmount = proposal.budgetMin;
        } else if (proposal.budgetMin) {
          finalAmount = proposal.budgetMin;
        } else if (proposal.budgetMax) {
          finalAmount = proposal.budgetMax;
        } else {
          throw new BadRequestException(
            "Proposal must have a budget to accept directly",
          );
        }
      }

      // Determine currency
      const finalCurrency = currency || proposal.currency || "ngn";

      // Create contract with proposal details (duration, default rateType)
      // Status is PENDING_CLIENT_APPROVAL - client needs to approve before payment
      const contract = transactionalManager.create(Contract, {
        proposal,
        // No bid reference since this is direct acceptance
        client: proposal.client,
        freelancer,
        amount: finalAmount,
        currency: finalCurrency,
        durationDays: proposal.durationEstimateDays, // From proposal
        rateType: BidRateType.FIXED, // Default to FIXED for direct acceptance
        status: ContractStatus.PENDING_CLIENT_APPROVAL,
      });
      const savedContract = await transactionalManager.save(contract);

      // Don't mark proposal as HIRED yet - client needs to approve
      // Proposal remains OPEN so other freelancers can also accept
      // Only mark as HIRED when client approves a contract

      return savedContract;
    });
  }
}
