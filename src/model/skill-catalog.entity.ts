import { Column, Entity, ManyToMany, OneToMany } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { Proposal } from "./proposal.entity";
import { FreelancerProfile } from "./freelancer-profile.entity";

@Entity("skill_catalog")
export class SkillCatalog extends SoftDeletableEntity {
  protected id_prefix = "skc";

  @Column({ name: "name", unique: true })
  name: string;

  @Column({ name: "category", nullable: true })
  category: string; // e.g. "Programming", "Design", "Marketing"

  @ManyToMany(() => Proposal, (proposal) => proposal.skills)
  proposals: Proposal[];

  @ManyToMany(() => FreelancerProfile, (freelancer) => freelancer.skills)
  freelancers: FreelancerProfile[];
}
