import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export type UserRole = 'Freelancer' | 'Admin' | 'Looking to Hire';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ['Freelancer', 'Admin', 'Looking to Hire'],
    default: 'Freelancer',
  })
  role: UserRole;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;
}
