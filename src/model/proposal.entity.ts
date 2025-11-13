import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
  JoinColumn,
  BeforeUpdate,
  BeforeInsert,
} from "typeorm";
import { User } from "./user.entity";
import { Bid } from "./bid.entity";
import { SkillCatalog } from "./skill-catalog.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { slugify } from "transliteration";

export enum ProposalStatus {
  OPEN = "open",
  CLOSED = "closed",
  CANCELLED = "cancelled",
  HIRED = "hired",
}

@Entity({ name: "proposal" })
export class Proposal extends SoftDeletableEntity {
  protected id_prefix = "prop";

  @Column({ length: 255 })
  title: string;

  @Column("text")
  description: string;

  @Column({ type: "jsonb", nullable: true })
  descriptionTree?: Record<string, any>;

  @Column({ name: "client_id", nullable: false })
  clientId: string;

  @ManyToOne(() => User, (user) => user.proposals, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "client_id" })
  client: User;

  // Budget can be fixed (budgetMin === budgetMax) or a range
  @Column({ type: "int", nullable: true })
  budgetMin?: number;

  @Column({ type: "int", nullable: true })
  budgetMax?: number;

  @Column({ length: 10, default: "ngn" })
  currency: string;

  @Column({ type: "int", nullable: true })
  durationEstimateDays?: number;

  @ManyToMany(() => SkillCatalog, (skill) => skill.proposals, { cascade: true })
  @JoinTable({ name: "proposal_skills" })
  skills: SkillCatalog[];

  @OneToMany(() => Bid, (bid) => bid.proposal)
  bids: Bid[];

  @DbAwareColumn({
    type: "enum",
    enum: ProposalStatus,
    nullable: false,
    default: ProposalStatus.OPEN,
    name: "user_status",
  })
  status: ProposalStatus;

  @Column({ default: false })
  inviteOnly: boolean;

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Index()
  @Column({ default: 0 })
  viewCount: number;

  @Column({ unique: true })
  slug: string;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.title) {
      const baseSlug = slugify(this.title.toLowerCase());
      // add id suffix for uniqueness (since title can repeat)
      this.slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
    }
  }
}
