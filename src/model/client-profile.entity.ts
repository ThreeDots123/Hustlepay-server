import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { User } from "./user.entity";

@Entity("client_profile")
export class ClientProfile extends SoftDeletableEntity {
  protected id_prefix = "clp";

  @Column({ name: "company_name", nullable: true })
  companyName: string;

  @Column({ name: "phone_number", nullable: true })
  phoneNumber: string;

  @Column({ name: "country", nullable: true, default: "NGN" })
  country: string;

  @Column({ name: "industry", nullable: true })
  industry: string;

  @Column({ name: "user_id", nullable: false })
  userId: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
