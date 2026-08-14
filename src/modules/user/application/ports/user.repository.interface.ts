import type { EntityManager } from 'typeorm';
import { IRepository } from '@shared/domain/repository.interface';
import type { User } from '../../domain/entities/user.entity';

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;

  /**
   * @param manager optional transactional EntityManager — pass it to enlist the
   * write in an ongoing transaction (e.g. the outbox write in the same tx).
   */
  save(entity: User, manager?: EntityManager): Promise<User>;
}
