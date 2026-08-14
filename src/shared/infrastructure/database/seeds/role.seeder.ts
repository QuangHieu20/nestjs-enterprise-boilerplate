import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { RolesOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/roles.orm-entity';
import { PermissionOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/permissions.orm-entity';
import { RolePermissionOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/role-permission.orm-entity';

import { Action } from '@modules/access-control/domain/enums/action.enum';
import { AppSubject } from '@modules/access-control/domain/types/app-subject.type';

export default class RoleSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const roleRepo = dataSource.getRepository(RolesOrmEntity);
    const permissionRepo = dataSource.getRepository(PermissionOrmEntity);
    const rolePermissionRepo = dataSource.getRepository(
      RolePermissionOrmEntity,
    );

    const permissionRules: {
      action: Action;

      subject: AppSubject;
    }[] = [
      {
        action: Action.READ,

        subject: AppSubject.POST,
      },
    ];

    const permissions: PermissionOrmEntity[] = [];

    for (const rule of permissionRules) {
      let permission = await permissionRepo.findOneBy({
        action: rule.action,
        subject: rule.subject,
      });

      if (!permission) {
        permission = await permissionRepo.save(permissionRepo.create(rule));

        console.log(`Seeded permission: ${rule.action}:${rule.subject}`);
      }

      if (permission) {
        permissions.push(permission);
      }
    }

    const roleNames = ['admin', 'guest'];

    const roles: Record<string, RolesOrmEntity> = {};

    for (const name of roleNames) {
      let role = await roleRepo.findOne({
        where: { name },
        relations: {
          rolePermissions: {
            permission: true,
          },
        },
      });

      if (!role) {
        role = await roleRepo.save(
          roleRepo.create({
            name,
          }),
        );

        console.log(`Seeded role: ${name}`);
      }

      roles[name] = role;
    }

    const existedPermissionIds = new Set(
      roles.admin.rolePermissions?.map((rp) => rp.permission.id) ?? [],
    );

    const assignPermissions = permissions.filter(
      (permission) => !existedPermissionIds.has(permission.id),
    );

    for (const permission of assignPermissions) {
      await rolePermissionRepo.save(
        rolePermissionRepo.create({
          role: roles.admin,
          permission,
        }),
      );
    }

    if (assignPermissions.length > 0) {
      console.log('Assigned permissions -> admin');
    }
  }
}
