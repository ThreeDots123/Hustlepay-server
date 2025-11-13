import { Entity, Column, ManyToOne, Index, JoinColumn } from "typeorm";
import { Contract } from "./contract.entity";
import { User } from "./user.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";

export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  ESCROWED = "escrowed",
  REFUNDED = "refunded",
  DISPUTED = "disputed",
}

@Entity({ name: "payments" })
export class Payment extends SoftDeletableEntity {
  protected id_prefix = "paymnt";

  @Column({ name: "contract_id", nullable: false })
  contractId: string;

  @ManyToOne(() => Contract, (c) => c.payments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contract_id" })
  contract: Contract;

  @ManyToOne(() => User, (u) => u.payments, {
    nullable: false,
    onDelete: "SET NULL",
  })
  payer: User; // usually the client

  @Column({ type: "int" })
  amount: number;

  @Column({ length: 10, default: "ngn" })
  currency: string;

  @DbAwareColumn({
    type: "enum",
    enum: PaymentStatus,
    nullable: false,
    default: PaymentStatus.PENDING,
    name: "user_status",
  })
  status: PaymentStatus;

  // provider fields
  @Index()
  @Column({ length: 255, nullable: true })
  providerPaymentId?: string;

  @Column("jsonb", { nullable: true })
  providerRaw?: any;
}
