import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { AuthProvider, User } from '@modules/user/domain/entities/user.entity';
import { IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { UserOrmEntity } from '@modules/user/infrastructure/persistence/entities/user.orm-entity';
import { BaseTypeOrmRepository } from '@shared/infrastructure/database/base.typeorm-repository';

@Injectable()
export class UserTypeOrmRepository
  extends BaseTypeOrmRepository<User, UserOrmEntity>
  implements IUserRepository
{
  constructor(
    @InjectRepository(UserOrmEntity)
    ormRepository: Repository<UserOrmEntity>,
  ) {
    super(ormRepository);
  }

  protected toDomain(orm: UserOrmEntity): User {
    return new User(
      {
        email: orm.email,
        password: orm.password,
        displayName: orm.displayName,
        isActive: orm.isActive,
        googleId: orm.googleId,
        provider: orm.provider as AuthProvider,
      },
      orm.id,
    );
  }

  protected toOrm(domain: User): DeepPartial<UserOrmEntity> {
    return {
      id: domain.id,
      email: domain.email,
      password: domain.password,
      displayName: domain.displayName,
      isActive: domain.isActive,
      googleId: domain.googleId,
      provider: domain.provider,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    // `password` is `select: false` on the ORM entity, so it must be opted back
    // in explicitly — this is the only read path that needs the hash.
    const entity = await this.ormRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User, manager?: EntityManager): Promise<User> {
    // When a transactional manager is supplied, enlist this write in that
    // transaction (so it commits atomically with, e.g., the outbox row).
    if (!manager) {
      return super.save(user);
    }

    const repo = manager.getRepository(UserOrmEntity);
    const orm = this.toOrm(user);
    const saved = await repo.save(orm as UserOrmEntity);
    return this.toDomain(saved);
  }
}
