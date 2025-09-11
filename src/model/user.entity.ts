import { SoftDeletableEntity } from 'src/interface/model/soft-deletable.entity';
import { Entity } from 'typeorm';

@Entity('user')
export class User extends SoftDeletableEntity {
  protected id_prefix = 'usr';
}
