import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { Contract } from "./contract.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";
import { BaseEntity } from "src/interface/model/base.entity";

export enum MilestoneStatus {
  PENDING = "pending",
  SUBMITTED = "submitted",
  APPROVED = "approved",
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
}
