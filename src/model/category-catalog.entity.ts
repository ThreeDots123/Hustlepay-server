import { Column, Entity, ManyToMany } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { Proposal } from "./proposal.entity";

@Entity("category_catalog")
export class CategoryCatalog extends SoftDeletableEntity {
  protected id_prefix = "ctc";

  @Column({ name: "name", unique: true })
  name: string;

  @ManyToMany(() => Proposal, (proposal) => proposal.categories)
  proposals: Proposal[];
}
