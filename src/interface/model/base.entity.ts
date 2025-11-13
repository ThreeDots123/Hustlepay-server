import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { resolveDbType } from 'src/utils/db-parse-column';
import generateEntityId from 'src/utils/generate-entity-id';

/**
 * Base abstract entity for all entities
 */

export abstract class BaseEntity {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn({ type: resolveDbType('timestamptz'), name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: resolveDbType('timestamptz'), name: 'updated_at' })
  updatedAt: Date;

  @Exclude()
  protected abstract readonly id_prefix: string;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, this.id_prefix);
  }
}
