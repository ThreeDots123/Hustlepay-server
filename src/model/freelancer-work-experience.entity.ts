import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { FreelancerProfile } from "./freelancer-profile.entity";

@Entity("freelancer_work_experience")
export class FreelancerWorkExperience extends SoftDeletableEntity {
  protected id_prefix = "fwe";

  @Column({ name: "freelancer_profile_id", nullable: false })
  freelancerProfileId: string;

  @ManyToOne(() => FreelancerProfile, (profile) => profile.workExperiences, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "freelancer_profile_id" })
  freelancerProfile: FreelancerProfile;

  @Column({ name: "job_title", nullable: false })
  jobTitle: string;

  @Column({ name: "company", nullable: false })
  company: string;

  @Column({ name: "duration", nullable: true })
  duration: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;
}
