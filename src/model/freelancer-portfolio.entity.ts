import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { FreelancerProfile } from "./freelancer-profile.entity";

@Entity("freelancer_portfolio")
export class FreelancerPortfolio extends SoftDeletableEntity {
  protected id_prefix = "fpo";

  @Column({ name: "freelancer_profile_id", nullable: false })
  freelancerProfileId: string;

  @ManyToOne(() => FreelancerProfile, (profile) => profile.portfolios, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "freelancer_profile_id" })
  freelancerProfile: FreelancerProfile;

  @Column({ name: "title", nullable: false })
  title: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "image_url", nullable: true })
  imageUrl: string;
}
