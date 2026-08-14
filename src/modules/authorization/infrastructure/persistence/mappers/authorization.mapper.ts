import { Authorization } from '@modules/authorization/domain/entities/authorization.entity';
import { UserRoleOrmEntity } from '../entities/user-role.orm-entity';
import { PermissionRule } from '@modules/access-control/domain/types/app-ability.type';

export class AuthorizationMapper {
  static toDomain(userRoles: UserRoleOrmEntity[]): Authorization {
    const permissions: PermissionRule[] = userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => ({
        action: rp.permission.action,

        subject: rp.permission.subject,
      })),
    );
    return new Authorization({ permissions });
  }
}
