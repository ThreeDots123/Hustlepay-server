import { Column, Entity, OneToMany } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { Skill } from "./skill.entity";

@Entity("skill_catalog")
export class SkillCatalog extends SoftDeletableEntity {
  protected id_prefix = "skc";

  @Column({ name: "name", unique: true })
  name: string;

  @Column({ name: "category", nullable: true })
  category: string; // e.g. "Programming", "Design", "Marketing"

  @OneToMany(() => Skill, (skill) => skill.catalog)
  skills: Skill[];
}
