import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { FreelancerProfile } from "./freelancer-profile.entity";

@Entity("freelancer_education")
export class FreelancerEducation extends SoftDeletableEntity {
  protected id_prefix = "fed";

  @Column({ name: "freelancer_profile_id", nullable: false })
  freelancerProfileId: string;

  @ManyToOne(() => FreelancerProfile, (profile) => profile.educations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "freelancer_profile_id" })
  freelancerProfile: FreelancerProfile;

  @Column({ name: "degree", nullable: false })
  degree: string;

  @Column({ name: "school", nullable: false })
  school: string;

  @Column({ name: "year", nullable: true })
  year: string;
}
