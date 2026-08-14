import {
  Repository,
  FindOptionsWhere,
  DeepPartial,
  ObjectLiteral,
} from 'typeorm';
import { IRepository } from '../../domain/repository.interface';

/**
 * Subclasses own the @InjectRepository binding and pass it up:
 *
 *   constructor(@InjectRepository(UserOrmEntity) repo: Repository<UserOrmEntity>) {
 *     super(repo);
 *   }
 */
export abstract class BaseTypeOrmRepository<
  TDomain,
  TOrm extends ObjectLiteral,
> implements IRepository<TDomain> {
  constructor(protected readonly ormRepository: Repository<TOrm>) {}

  protected abstract toDomain(ormEntity: TOrm): TDomain;
  protected abstract toOrm(domainEntity: TDomain): DeepPartial<TOrm>;

  async findById(id: string): Promise<TDomain | null> {
    const entity = await this.ormRepository.findOne({
      where: { id } as unknown as FindOptionsWhere<TOrm>,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<TDomain[]> {
    const entities = await this.ormRepository.find();
    return entities.map((e) => this.toDomain(e));
  }

  async save(domainEntity: TDomain): Promise<TDomain> {
    const ormEntity = this.toOrm(domainEntity);
    const saved = await this.ormRepository.save(ormEntity as TOrm);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.ormRepository.existsBy({
      id,
    } as unknown as FindOptionsWhere<TOrm>);
  }
}
