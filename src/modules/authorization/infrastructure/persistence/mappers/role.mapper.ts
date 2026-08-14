import { Role } from '@modules/authorization/domain/entities/role.entity';
import { Permission } from '@modules/authorization/domain/entities/permission.entity';
import { RolesOrmEntity } from '../entities/roles.orm-entity';

export class RoleMapper {
  static toDomain(orm: RolesOrmEntity): Role {
    return new Role(
      {
        name: orm.name,
        permissions:
          orm.rolePermissions?.map(
            (rp) =>
              new Permission(
                {
                  action: rp.permission.action,
                  subject: rp.permission.subject,
                },
                rp.permission.id,
              ),
          ) ?? [],
      },
      orm.id,
    );
  }

  static toOrm(domain: Role): Partial<RolesOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
    };
  }
}
