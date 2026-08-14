import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IRefreshTokenRepository } from '@modules/auth/application/ports/refresh-token.repository.interface';
import { RefreshToken } from '@modules/auth/domain/entities/refresh-token.entity';
import { RefreshTokenOrmEntity } from '@modules/auth/infrastructure/persistence/entities/refresh-token.orm-entity';

@Injectable()
export class RefreshTokenTypeOrmRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  private toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return new RefreshToken(
      {
        userId: orm.userId,
        jti: orm.jti,
        familyId: orm.familyId,
        expiresAt: orm.expiresAt,
        revokedAt: orm.revokedAt,
      },
      orm.id,
    );
  }

  private toOrm(domain: RefreshToken): Partial<RefreshTokenOrmEntity> {
    return {
      id: domain.id,
      userId: domain.userId,
      jti: domain.jti,
      familyId: domain.familyId,
      expiresAt: domain.expiresAt,
      revokedAt: domain.revokedAt,
    };
  }

  async findByJti(jti: string): Promise<RefreshToken | null> {
    const entity = await this.repo.findOneBy({ jti });
    return entity ? this.toDomain(entity) : null;
  }

  async save(token: RefreshToken): Promise<RefreshToken> {
    const saved = await this.repo.save(
      this.toOrm(token) as RefreshTokenOrmEntity,
    );
    return this.toDomain(saved);
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.repo.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
