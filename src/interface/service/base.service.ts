import { EntityManager, Repository, ObjectLiteral } from 'typeorm';
import { BaseEntity } from '../model/base.entity';

export default abstract class BaseService {
  // perform entity operations, can be transactional or not
  protected async performEntityOps<TEntity extends ObjectLiteral, TResult>({
    repositoryManager,
    transactionalEntity,
    action,
    opsArgs,
  }: {
    repositoryManager: Repository<TEntity>;
    transactionalEntity: EntityManager | undefined;
    action: keyof {
      [K in keyof Repository<TEntity> &
        keyof EntityManager]: Repository<TEntity>[K] extends Function
        ? K
        : never;
    };
    opsArgs: Array<any>;
  }): Promise<TResult> {
    const args =
      opsArgs[0].prototype instanceof BaseEntity && !transactionalEntity
        ? opsArgs.slice(1)
        : opsArgs;
    const executor = transactionalEntity ?? repositoryManager;
    return (executor[action] as Function)(...args) as Promise<TResult>;
  }
}
