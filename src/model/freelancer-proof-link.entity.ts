import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { User } from "./user.entity";

@Entity("freelancer_proof_link")
export class FreelancerProofLink extends SoftDeletableEntity {
  protected id_prefix = "fpl";

  @Column({ name: "user_id", nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 100, nullable: true })
  label: string | null;

  @Column({ type: "varchar", length: 2048, nullable: false })
  url: string;
}
