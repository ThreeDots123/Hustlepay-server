import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Proposal, ProposalStatus } from "../model/proposal.entity";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { UpdateProposalDto } from "./dto/update-proposal.dto";
import { User as UserEntity } from "../model/user.entity";
import { SkillCatalog as SkillCatalogEntity } from "../model/skill-catalog.entity";

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    @InjectRepository(SkillCatalogEntity)
    private readonly skillRepo: Repository<SkillCatalogEntity>,
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

    const p = this.proposalRepo.create({
      title: dto.title,
      description: dto.description,
      ...(dto.descriptionTree && { descriptionTree: dto.descriptionTree }),
      clientId,
      budgetMin: dto.budgetMin,
      budgetMax: dto.budgetMax,
      durationEstimateDays: dto.durationEstimateDays,
      skills,
    });

    const savedProposal = await this.proposalRepo.save(p);

    // await this.notifications.emitToAdmins('proposal.created', { proposalId: saved.id });
    console.log("Notification to admins: proposal.created", {
      proposalId: savedProposal.id,
    });
    return savedProposal;
  }

  async findOne(id: string) {
    const p = await this.proposalRepo.findOne({
      where: { id },
      relations: ["client", "skills", "bids"],
    });
    if (!p) throw new NotFoundException("Proposal not found");
    return p;
  }

  async findAll(
    {
      page = 1,
      limit = 20,
      skill,
    }: {
      page?: number;
      limit?: number;
      skill?: string;
    },
    clientId?: string,
  ) {
    const qb = this.proposalRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.skills", "s");

    if (clientId) qb.andWhere("p.clientId = :clientId", { clientId });
    else {
      qb.leftJoinAndSelect("p.client", "client");
      // Only show proposals that are not closed
      qb.where("p.status != :status", { status: ProposalStatus.CLOSED });
    }

    if (skill) qb.andWhere("s.slug = :skill", { skill });
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
}
