import { Entity, JoinColumn, ManyToOne } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { SkillCatalog } from "./skill-catalog.entity";
import { FreelancerProfile } from "./freelancer-profile.entity";

@Entity("skill")
export class Skill extends SoftDeletableEntity {
  protected id_prefix = "skl";

  @ManyToOne(
    () => FreelancerProfile,
    (freelancerProfile) => freelancerProfile.skills,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "freelancer_profile_id" })
  freelancerProfile: FreelancerProfile;

  @ManyToOne(() => SkillCatalog, (catalog) => catalog.skills, {
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn({ name: "catalog_id" })
  catalog: SkillCatalog;
}
