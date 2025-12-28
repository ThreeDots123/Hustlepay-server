import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { FreelancerProfile } from "./freelancer-profile.entity";

@Entity("freelancer_language")
export class FreelancerLanguage extends SoftDeletableEntity {
  protected id_prefix = "fla";

  @Column({ name: "freelancer_profile_id", nullable: false })
  freelancerProfileId: string;

  @ManyToOne(() => FreelancerProfile, (profile) => profile.languages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "freelancer_profile_id" })
  freelancerProfile: FreelancerProfile;

  @Column({ name: "language", nullable: false })
  language: string;

  @Column({ name: "proficiency", nullable: false })
  proficiency: string;
}
