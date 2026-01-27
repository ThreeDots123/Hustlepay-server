import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Contract } from "./contract.entity";
import { Milestone } from "./milestone.entity";
import { BaseEntity } from "src/interface/model/base.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";

export enum DeliverableStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  VERIFIED = "verified", // Client verified the deliverable
}

@Entity({ name: "deliverable" })
export class Deliverable extends BaseEntity {
  protected id_prefix = "dlvr";

  @Column({ name: "contract_id", nullable: true })
  contractId?: string;

  @ManyToOne(() => Contract, (c) => c.deliverables, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contract_id" })
  contract?: Contract;

  @Column({ name: "milestone_id", nullable: true })
  milestoneId?: string;

  @ManyToOne(() => Milestone, (m) => m.deliverables, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "milestone_id" })
  milestone?: Milestone;

  @Column({ length: 255 })
  title: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column({ type: "int", default: 0 })
  order: number; // For ordering deliverables

  @DbAwareColumn({
    type: "enum",
    enum: DeliverableStatus,
    nullable: false,
    default: DeliverableStatus.PENDING,
    name: "user_status",
  })
  status: DeliverableStatus;

  // Ensure either contractId or milestoneId is set, but not both
  // This will be validated in the service layer
}
