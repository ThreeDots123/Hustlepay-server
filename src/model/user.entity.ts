import { SoftDeletableEntity } from 'src/interface/model/soft-deletable.entity';
import { DbAwareColumn, resolveDbType } from 'src/utils/db-parse-column';
import { Column, Entity, OneToOne } from 'typeorm';
import { Password } from './user-password.entity';

export enum UserRole {
  FREELANCER = 'freelancer',
  ADMIN = 'admin',
  CLIENT = 'client',
}

export enum AuthMethod {
  PASSWORD = 'password',
  GMAIL = 'gmail',
  PASSWORDLESS = 'passwordless',
}

@Entity('user')
export class User extends SoftDeletableEntity {
  protected id_prefix = 'usr';

  @Column({ name: 'first_name' })
  firstname: string;

  @Column({ name: 'last_name' })
  lastname: string;

  @Column({ unique: true })
  email: string;

  @DbAwareColumn({
    type: 'enum',
    enum: AuthMethod,
    nullable: false,
    default: AuthMethod.PASSWORD,
    name: 'auth_method',
  })
  authMethod: AuthMethod;

  @DbAwareColumn({
    type: 'enum',
    enum: UserRole,
    nullable: false,
    default: UserRole.CLIENT,
    name: 'user_role',
  })
  role: UserRole;

  // @DbAwareColumn({
  //   type: 'enum',
  //   enum: ,
  //   nullable: false,
  //   default: ,
  //   name: 'user_status',
  // })
  // status: ;

  @Column({
    name: 'last_login',
    type: resolveDbType('timestamptz'),
    default: () => 'NOW()',
  })
  lastLogin: Date;

  @OneToOne(() => Password, (pswd) => pswd.user)
  password: Password;
}
