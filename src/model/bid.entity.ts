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

  @Column("text")
  coverLetter: string;

  @Column({ type: "int", nullable: true })
  proposedBudget?: number;

  @Column({ type: "int", nullable: true })
  proposedDurationDays?: number;

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
