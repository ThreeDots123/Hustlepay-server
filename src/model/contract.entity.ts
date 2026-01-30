import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Proposal } from "./proposal.entity";
import { Bid } from "./bid.entity";
import { Milestone } from "./milestone.entity";
import { Payment } from "./payment.entity";
import { Deliverable } from "./deliverable.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { BidRateType } from "./bid.entity";

export enum ContractStatus {
  PENDING_CLIENT_APPROVAL = "pending_client_approval", // Freelancer accepted proposal, waiting for client to approve
  AWAITING_PAYMENT = "awaiting_payment",
  PAYMENT_INITIATED = "payment_initiated", // Payment initiated for contract
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DISPUTED = "disputed",
}

@Entity({ name: "contract" })
export class Contract extends SoftDeletableEntity {
  protected id_prefix = "ctrct";

  @Column({ name: "proposal_id", nullable: true })
  proposalId?: string;

  @ManyToOne(() => Proposal, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "proposal_id" })
  proposal?: Proposal;

  @Column({ name: "bid_id", nullable: true })
  bidId?: string;

  @ManyToOne(() => Bid, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "bid_id" })
  bid?: Bid;

  @Column({ name: "client_id", nullable: false })
  clientId: string;

  @Column({ name: "freelancer_id", nullable: false })
  freelancerId: string;

  @ManyToOne(() => User, (u) => u.clientContracts, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "client_id" })
  client: User;

  @ManyToOne(() => User, (u) => u.freelancerContracts, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "freelancer_id" })
  freelancer: User;

  // final agreed amount for the contract (in smallest currency units)
  @Column({ type: "int" })
  amount: number;

  @Column({ length: 10, default: "ngn" })
  currency: string;

  // Duration in days - from bid's proposedDurationDays or proposal's durationEstimateDays
  @Column({ type: "int", nullable: true })
  durationDays?: number;

  // Rate type - from bid's rateType (if from bid) or default to FIXED (if from proposal)
  @DbAwareColumn({
    type: "enum",
    enum: BidRateType,
    nullable: true,
    name: "rate_type",
  })
  rateType?: BidRateType;

  @DbAwareColumn({
    type: "enum",
    enum: ContractStatus,
    nullable: false,
    default: ContractStatus.AWAITING_PAYMENT,
    name: "user_status",
  })
  status: ContractStatus;

  @OneToMany(() => Milestone, (m) => m.contract, { cascade: true })
  milestones: Milestone[];

  @OneToMany(() => Payment, (p) => p.contract)
  payments: Payment[];

  @OneToMany(() => Deliverable, (d) => d.contract, { cascade: true })
  deliverables: Deliverable[];

  // Submission fields for full contracts
  @DbAwareColumn({
    type: "jsonb",
    nullable: true,
    name: "submission_attachments",
  })
  submissionAttachments?: Array<{
    id: string;
    name: string;
    type: "image" | "video" | "document" | "other";
    size: number;
    url: string; // URL to the uploaded file
  }>;

  @Column({ type: "text", nullable: true, name: "submission_links" })
  submissionLinks?: string; // Concatenated links separated by "|"

  @Column({ type: "text", nullable: true, name: "submission_description" })
  submissionDescription?: string; // Submission notes/description
}
