import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { User } from "src/model/user.entity";
import { GigPackage } from "src/model/gig-package.entity";

@Entity("gig")
export class Gig extends SoftDeletableEntity {
  protected id_prefix = "gig";

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "freelancer_id", nullable: false })
  freelancerId: string;

  @Column({ type: "varchar", length: 255 })
  category: string; // could be normalized later into a `gig_category` table

  @Column("text", { array: true, nullable: true })
  tags?: string[]; // keywords for search (optional)

  @ManyToOne(() => User, (user) => user.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "freelancer_id" })
  freelancer: User;

  @OneToMany(() => GigPackage, (pkg) => pkg.gig, { cascade: true })
  packages: GigPackage[];
}
