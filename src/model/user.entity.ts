import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { DbAwareColumn, resolveDbType } from "src/utils/db-parse-column";
import { Column, Entity, OneToMany, OneToOne } from "typeorm";
import { Password } from "./user-password.entity";
import { Proposal } from "./proposal.entity";
import { Bid } from "./bid.entity";
import { Contract } from "./contract.entity";
import { Message } from "./message.entity";
import { Payment } from "./payment.entity";
import { FreelancerProfile } from "./freelancer-profile.entity";
import { Wallet } from "./wallet.entity";

export enum UserRole {
  FREELANCER = "freelancer",
  ADMIN = "admin",
  CLIENT = "client",
}

export enum AuthMethod {
  PASSWORD = "password",
  GMAIL = "gmail",
  PASSWORDLESS = "passwordless",
}

export enum UserStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  PENDING = "pending",
}

@Entity("user")
export class User extends SoftDeletableEntity {
  protected id_prefix = "usr";

  @Column({ name: "first_name" })
  firstname: string;

  @Column({ name: "last_name" })
  lastname: string;

  @Column({ unique: true })
  email: string;

  @DbAwareColumn({
    type: "enum",
    enum: AuthMethod,
    nullable: false,
    default: AuthMethod.PASSWORD,
    name: "auth_method",
  })
  authMethod: AuthMethod;

  @DbAwareColumn({
    type: "enum",
    enum: UserRole,
    nullable: false,
    default: UserRole.CLIENT,
    name: "user_role",
  })
  role: UserRole;

  @DbAwareColumn({
    type: "enum",
    enum: UserStatus,
    nullable: false,
    default: UserStatus.PENDING,
    name: "user_status",
  })
  status: UserStatus;

  @Column({
    name: "last_login",
    type: resolveDbType("timestamptz"),
    default: () => "NOW()",
  })
  lastLogin: Date;

  @Column({ name: "is_verified", default: false })
  isVerified: boolean;

  @OneToOne(() => Password, (pswd) => pswd.user)
  password: Password;

  @OneToMany(() => Proposal, (proposal) => proposal.client)
  proposals: Proposal[];

  @OneToOne(() => FreelancerProfile, (profile) => profile.user)
  freelancerProfile: FreelancerProfile;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => Bid, (bid) => bid.freelancer)
  bids: Bid[];

  @OneToMany(() => Contract, (contract) => contract.client)
  clientContracts: Contract[];

  @OneToMany(() => Contract, (contract) => contract.freelancer)
  freelancerContracts: Contract[];

  @OneToMany(() => Message, (m) => m.sender)
  messages: Message[];

  @OneToMany(() => Payment, (p) => p.payer)
  payments: Payment[];
}
