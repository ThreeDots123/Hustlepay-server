import { Entity, Column, ManyToOne, Index, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Proposal } from "./proposal.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";
import { BaseEntity } from "src/interface/model/base.entity";

export enum BidStatus {
  PENDING = "pending",
  WITHDRAWN = "withdrawn",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export enum BidRateType {
  FIXED = "fixed",
  HOURLY = "hourly",
  PROJECT = "project",
}

export enum BidExperienceLevel {
  ENTRY = "entry",
  INTERMEDIATE = "intermediate",
  EXPERT = "expert",
}

@Entity({ name: "bid" })
export class Bid extends BaseEntity {
  protected id_prefix = "bid";

  @Column({ name: "freelancer_id", nullable: false })
  freelancerId: string;

  @Column({ name: "proposal_id", nullable: false })
  proposalId: string;

  @ManyToOne(() => User, (u) => u.bids, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "freelancer_id" })
  freelancer: User;

  @ManyToOne(() => Proposal, (p) => p.bids, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "proposal_id" })
  proposal: Proposal;

  @Column({ type: "varchar", length: 255, nullable: false })
  title: string;

  @Column("text")
  coverLetter: string;

  @Column({ type: "int", nullable: false })
  proposedBudget: number;

  @DbAwareColumn({
    type: "enum",
    enum: BidRateType,
    nullable: false,
    default: BidRateType.FIXED,
    name: "rate_type",
  })
  rateType: BidRateType;

  @Column({ type: "int", nullable: false })
  proposedDurationDays: number;

  @DbAwareColumn({
    type: "enum",
    enum: BidExperienceLevel,
    nullable: true,
    name: "experience_level",
  })
  experience?: BidExperienceLevel;

  @Column({ type: "varchar", length: 500, nullable: true })
  portfolio?: string; // Portfolio/website URL

  @DbAwareColumn({
    type: "jsonb",
    nullable: true,
    name: "attachments",
  })
  attachments?: Array<{
    id: string;
    name: string;
    type: "image" | "video" | "document" | "other";
    size: number;
    url: string; // URL to the uploaded file
  }>;

  @DbAwareColumn({
    type: "enum",
    enum: BidStatus,
    nullable: false,
    default: BidStatus.PENDING,
    name: "user_status",
  })
  status: BidStatus;

  @Index()
  @Column({ default: 0 })
  messageCount: number; // quick metric for negotiation chat
}
