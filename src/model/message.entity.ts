import { Entity, Column, ManyToOne, Index, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Proposal } from "./proposal.entity";
import { Contract } from "./contract.entity";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";

@Entity({ name: "message" })
export class Message extends SoftDeletableEntity {
  protected id_prefix = "msg";

  @Column({ name: "sender_id", nullable: false })
  senderId: string;

  @ManyToOne(() => User, (u) => u.messages, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "sender_id" })
  sender: User;

  // A message can belong to either a proposal (pre-hire) or a contract (post-hire)
  @Column({ name: "proposal_id", nullable: true })
  proposalId?: string;

  @Column({ name: "contract_id", nullable: true })
  contractId?: string;

  @ManyToOne(() => Proposal, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "proposal_id" })
  proposal?: Proposal;

  @ManyToOne(() => Contract, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "contract_id" })
  contract?: Contract;

  @Column("text")
  body: string;

  @Column({ nullable: true })
  attachmentUrl?: string;

  @Index()
  @Column({ default: false })
  isRead: boolean;
}
