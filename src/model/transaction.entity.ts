import { Entity, Column, ManyToOne, Index, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Contract } from "./contract.entity";
import { Milestone } from "./milestone.entity";
import { Payment } from "./payment.entity";
import { Wallet } from "./wallet.entity";
import { DbAwareColumn } from "src/utils/db-parse-column";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";

export enum TransactionType {
  // Freelancer transactions
  PAYMENT_RECEIVED = "payment_received", // When payment is made for a full project or milestone
  ESCROWED = "escrowed", // When funds are put in escrow (for freelancer view)
  RELEASED = "released", // When escrowed funds are released to freelancer wallet
  WITHDRAWN = "withdrawn", // When freelancer withdraws from wallet

  // Client transactions
  PAYMENT_MADE = "payment_made", // When client makes a payment (full or milestone)
  ESCROWED_PAYMENT = "escrowed_payment", // When client's payment is escrowed (for client view)
  REFUNDED = "refunded", // When client receives a refund

  // Shared transaction types
  CONTRACT_PAYMENT = "contract_payment", // Full contract payment
  MILESTONE_PAYMENT = "milestone_payment", // Milestone-specific payment
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

@Entity({ name: "transactions" })
export class Transaction extends SoftDeletableEntity {
  protected id_prefix = "trnsctn";

  @Column({ name: "user_id", nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (u) => u.transactions, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @DbAwareColumn({
    type: "enum",
    enum: TransactionType,
    nullable: false,
    name: "transaction_type",
  })
  @Index()
  type: TransactionType;

  @Column({ type: "int", nullable: false })
  amount: number; // Amount in smallest currency unit (kobo for NGN)

  @Column({ length: 10, default: "ngn", nullable: false })
  currency: string;

  @DbAwareColumn({
    type: "enum",
    enum: TransactionStatus,
    nullable: false,
    default: TransactionStatus.PENDING,
    name: "user_status",
  })
  @Index()
  status: TransactionStatus;

  @Column({ type: "text", nullable: true })
  description?: string; // Human-readable description

  // Optional relations to related entities
  @Column({ name: "contract_id", nullable: true })
  @Index()
  contractId?: string;

  @ManyToOne(() => Contract, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "contract_id" })
  contract?: Contract;

  @Column({ name: "milestone_id", nullable: true })
  @Index()
  milestoneId?: string;

  @ManyToOne(() => Milestone, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "milestone_id" })
  milestone?: Milestone;

  @Column({ name: "payment_id", nullable: true })
  @Index()
  paymentId?: string;

  @ManyToOne(() => Payment, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "payment_id" })
  payment?: Payment;

  @Column({ name: "wallet_id", nullable: true })
  @Index()
  walletId?: string;

  @ManyToOne(() => Wallet, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "wallet_id" })
  wallet?: Wallet;

  // Metadata for additional information (e.g., withdrawal method, reference numbers, etc.)
  @Column("jsonb", { nullable: true })
  metadata?: {
    withdrawalMethod?: string;
    withdrawalAccount?: string;
    reference?: string;
    providerTransactionId?: string;
    notes?: string;
    [key: string]: any;
  };

  // Balance after this transaction (for wallet transactions)
  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    name: "balance_after",
  })
  balanceAfter?: number; // Wallet balance after this transaction
}
