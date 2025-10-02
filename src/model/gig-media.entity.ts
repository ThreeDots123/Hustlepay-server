import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { GigPackage } from "./gig-package.entity";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
}

@Entity("gig_media")
export class GigMedia extends SoftDeletableEntity {
  protected id_prefix = "gmd";

  @Column({ name: "gig_package_id", nullable: false })
  gigPkgId: string;

  @Column({
    type: "enum",
    enum: MediaType,
    default: MediaType.IMAGE,
  })
  type: MediaType;

  @Column({ type: "varchar", length: 500 })
  url: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  alt_text: string;

  @ManyToOne(() => GigPackage, (pkg) => pkg.media, { onDelete: "CASCADE" })
  @JoinColumn({ name: "gig_package_id" })
  gig: GigPackage;
}
