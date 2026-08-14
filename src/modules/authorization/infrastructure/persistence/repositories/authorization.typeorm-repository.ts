import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Authorization } from '@modules/authorization/domain/entities/authorization.entity';
import { IAuthorizationRepository } from '@modules/authorization/application/ports/authorization.repository.interface';
import { UserRoleOrmEntity } from '../entities/user-role.orm-entity';

@Injectable()
export class AuthorizationTypeOrmRepository implements IAuthorizationRepository {
  constructor(
    @InjectRepository(UserRoleOrmEntity)
    private readonly userRoleRepo: Repository<UserRoleOrmEntity>,
  ) {}

  async findAuthorizationByUserId(
    userId: string,
  ): Promise<Authorization | null> {
    const userRoles = await this.userRoleRepo.find({
      where: { user: { id: userId } },
      relations: { role: { rolePermissions: { permission: true } } },
    });

    if (!userRoles.length) return null;

    const permissions = userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((p) => ({
        action: p.permission.action,
        subject: p.permission.subject,
      })),
    );

    return new Authorization({ permissions });
  }
}
