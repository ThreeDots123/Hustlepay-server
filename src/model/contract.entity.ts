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
import { Milestone } from "./milestone.entity";
import { Payment } from "./payment.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";

export enum ContractStatus {
  AWAITING_PAYMENT = "awaiting_payment",
  ACTIVE = "active",
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
}
