import { BaseEntity } from 'src/interface/model/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('password')
export class Password extends BaseEntity {
  id_prefix = 'pswd';

  @Column()
  key: string;

  @Column({ name: 'user_id', nullable: false })
  userId: string;

  @OneToOne(() => User, (user) => user.password, {
    cascade: ['insert', 'remove'],
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
