import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '@modules/user/infrastructure/persistence/entities/user.orm-entity';
import { UserTypeOrmRepository } from '@modules/user/infrastructure/persistence/repositories/user.typeorm-repository';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
} from '@modules/user/application/ports/tokens';
import { BcryptPasswordHasher } from '@modules/user/infrastructure/adapters/bcrypt-password-hasher';
import { UserRoleOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/user-role.orm-entity';
import { PermissionOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/permissions.orm-entity';
import { RolesOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/roles.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      UserRoleOrmEntity,
      RolesOrmEntity,
      PermissionOrmEntity,
    ]),
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserTypeOrmRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER],
})
export class UserModule {}
