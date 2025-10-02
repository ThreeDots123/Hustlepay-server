import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { Gig } from "src/model/gig.entity";
import { GigMedia } from "./gig-media.entity";

export enum PackageType {
  BASIC = "basic",
  STANDARD = "standard",
  PREMIUM = "premium",
}

@Entity("gig_package")
export class GigPackage extends SoftDeletableEntity {
  protected id_prefix = "pkg";

  @Column({
    type: "enum",
    enum: PackageType,
  })
  type: PackageType;

  @Column({ type: "varchar", length: 255 })
  name: string; // e.g., "Basic Logo", "Standard Website", etc.

  @Column({ type: "text" })
  description: string;

  @Column({ name: "gig_id", nullable: false })
  gigId: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  price: number;

  @Column({ name: "delivery_days", type: "int" })
  deliveryDays: number;

  @Column("int", { nullable: true })
  revisions: number; // e.g., where -1 indicates unlimited revisions

  @Column("simple-array", { nullable: true })
  features: string[]; // e.g., ["Source File", "High Resolution"]

  @ManyToOne(() => Gig, (gig) => gig.packages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "gig_id" })
  gig: Gig;

  @OneToOne(() => GigMedia, (media) => media.gig, { cascade: true })
  media: GigMedia[];
}
