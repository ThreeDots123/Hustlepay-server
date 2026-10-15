import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FreelancerProofLink } from "src/model/freelancer-proof-link.entity";
import { UsersService } from "./user.service";
import { UserStatus } from "src/model/user.entity";

export interface ProofLinkInput {
  label?: string;
  url: string;
}

@Injectable()
export class FreelancerProofLinkService {
  constructor(
    @InjectRepository(FreelancerProofLink)
    private readonly repo: Repository<FreelancerProofLink>,
    private readonly userService: UsersService,
  ) {}

  private isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  async findByUserId(
    userId: string,
  ): Promise<{ id: string; label: string | null; url: string }[]> {
    const links = await this.repo.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
    return links.map((l) => ({ id: l.id, label: l.label ?? null, url: l.url }));
  }

  async replaceForUser(
    userId: string,
    links: ProofLinkInput[],
  ): Promise<{ id: string; label: string | null; url: string }[]> {
    if (!links.length) {
      throw new BadRequestException("At least one proof link is required.");
    }
    for (const item of links) {
      if (!this.isValidUrl(item.url)) {
        throw new BadRequestException(`Invalid URL: ${item.url}`);
      }
    }
    await this.repo.softDelete({ userId });
    const created = await Promise.all(
      links.map((item) =>
        this.repo.save(
          this.repo.create({
            userId,
            label: item.label?.trim() || null,
            url: item.url.trim(),
          }),
        ),
      ),
    );
    this.userService.updateUser(userId, { status: UserStatus.PENDING });

    return created.map((l) => ({
      id: l.id,
      label: l.label ?? null,
      url: l.url,
    }));
  }
}
