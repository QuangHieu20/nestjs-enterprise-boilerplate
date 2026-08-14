import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '@modules/user/infrastructure/persistence/entities/user.orm-entity';
import { AuthorizationTypeOrmRepository } from './infrastructure/persistence/repositories/authorization.typeorm-repository';
import { RoleTypeOrmRepository } from './infrastructure/persistence/repositories/role.typeorm-repository';
import {
  AUTHORIZATION_REPOSITORY,
  ROLE_REPOSITORY,
} from '@modules/authorization/application/ports/tokens';
import { AuthorizationController } from './presentation/controllers/authorization.controller';
import { RolesOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/roles.orm-entity';
import { UserRoleOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/user-role.orm-entity';
import { PermissionOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/permissions.orm-entity';
import { RolePermissionOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/role-permission.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RolesOrmEntity,
      UserRoleOrmEntity,
      PermissionOrmEntity,
      RolePermissionOrmEntity,
    ]),
  ],
  controllers: [AuthorizationController],
  providers: [
    {
      provide: AUTHORIZATION_REPOSITORY,
      useClass: AuthorizationTypeOrmRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleTypeOrmRepository,
    },
  ],
  exports: [AUTHORIZATION_REPOSITORY, ROLE_REPOSITORY],
})
export class AuthorizationModule {}
