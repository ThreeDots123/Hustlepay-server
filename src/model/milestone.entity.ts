import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Contract } from "./contract.entity";
import { Deliverable } from "./deliverable.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";
import { BaseEntity } from "src/interface/model/base.entity";

export enum MilestoneStatus {
  DRAFT = "draft",
  PENDING = "pending",
  PENDING_ACCEPTANCE = "pending_acceptance", // For parent milestones waiting for freelancer acceptance
  ACCEPTED = "accepted", // Parent milestone accepted by freelancer
  PAYMENT_INITIATED = "payment_initiated", // Payment initiated for milestone
  SUBMITTED = "submitted",
  APPROVED = "approved",
  COMPLETED = "completed",
  RELEASED = "released",
  DISPUTED = "disputed",
}

@Entity({ name: "milestone" })
export class Milestone extends BaseEntity {
  protected id_prefix = "mlstn";

  @Column({ name: "contract_id", nullable: false })
  contractId: string;

  @ManyToOne(() => Contract, (c) => c.milestones, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contract_id" })
  contract: Contract;

  @Column({ name: "parent_id", nullable: true })
  parentId?: string;

  @ManyToOne(() => Milestone, (m) => m.children, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parent_id" })
  parent?: Milestone;

  @OneToMany(() => Milestone, (m) => m.parent, { cascade: true })
  children: Milestone[];

  @OneToMany(() => Deliverable, (d) => d.milestone, { cascade: true })
  deliverables: Deliverable[];

  @Column({ length: 255 })
  title: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column({ type: "int" })
  amount: number;

  @DbAwareColumn({
    type: "enum",
    enum: MilestoneStatus,
    nullable: false,
    default: MilestoneStatus.PENDING,
    name: "user_status",
  })
  status: MilestoneStatus;

  @Column({ type: "timestamp", nullable: true })
  dueDate?: Date;

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

  // Helper method to check if this is a parent milestone
  get isParent(): boolean {
    return !this.parentId;
  }

  // Helper method to check if this is a child milestone
  get isChild(): boolean {
    return !!this.parentId;
  }
}
