import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { SoftDeletableEntity } from "src/interface/model/soft-deletable.entity";
import { User } from "./user.entity";
import { Skill } from "./skill.entity";

@Entity("freelancer_profile")
export class FreelancerProfile extends SoftDeletableEntity {
  protected id_prefix = "frp";

  @Column({ name: "display_name", nullable: true })
  displayName: string;

  @Column({ name: "bio", type: "text", nullable: true })
  bio: string;

  @Column({ name: "hourly_rate", type: "decimal", nullable: true })
  hourlyRate: number;

  @Column({ name: "experience_level", nullable: true })
  experienceLevel: string; // e.g. "beginner", "intermediate", "expert"

  @Column({ name: "user_id", nullable: false })
  userId: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => Skill, (skill) => skill.freelancerProfile, {
    cascade: true,
  })
  skills: Skill[];
}
