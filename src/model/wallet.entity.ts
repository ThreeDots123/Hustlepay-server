import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { User } from "./user.entity";

@Entity("wallet")
export class Wallet extends SoftDeletableEntity {
  protected id_prefix = "wlt";

  @Column({ name: "user_id", nullable: false, unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.wallet, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({
    name: "balance",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    nullable: false,
  })
  balance: number; // Balance in smallest currency unit (kobo for NGN)

  @Column({ length: 10, default: "ngn", nullable: false })
  currency: string; // Currency code (e.g., "ngn", "usd")
}
