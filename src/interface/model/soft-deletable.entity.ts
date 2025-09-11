import { BaseEntity } from './base.entity';
import { DeleteDateColumn, Index } from 'typeorm';
import { resolveDbType } from '../../utils/db-parse-column';

export abstract class SoftDeletableEntity extends BaseEntity {
  @DeleteDateColumn({ type: resolveDbType('timestamptz'), name: 'deleted_at' })
  deletedAt: Date | null;
}
