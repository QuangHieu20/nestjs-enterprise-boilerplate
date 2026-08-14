import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsRelations, Repository } from 'typeorm';
import { Role } from '@modules/authorization/domain/entities/role.entity';
import { IRoleRepository } from '@modules/authorization/application/ports/role.repository.interface';
import { RolesOrmEntity } from '../entities/roles.orm-entity';
import { RolePermissionOrmEntity } from '../entities/role-permission.orm-entity';
import { RoleMapper } from '../mappers/role.mapper';
import { BaseTypeOrmRepository } from '@shared/infrastructure/database/base.typeorm-repository';

/**
 * RoleMapper reads `rolePermissions[].permission`, so the nested relation must
 * be loaded too — `{ rolePermissions: true }` alone leaves `permission` undefined.
 */
const ROLE_RELATIONS: FindOptionsRelations<RolesOrmEntity> = {
  rolePermissions: { permission: true },
};

@Injectable()
export class RoleTypeOrmRepository
  extends BaseTypeOrmRepository<Role, RolesOrmEntity>
  implements IRoleRepository
{
  constructor(
    @InjectRepository(RolesOrmEntity)
    ormRepository: Repository<RolesOrmEntity>,
    @InjectRepository(RolePermissionOrmEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionOrmEntity>,
  ) {
    super(ormRepository);
  }

  protected toDomain(orm: RolesOrmEntity): Role {
    return RoleMapper.toDomain(orm);
  }

  protected toOrm(domain: Role): DeepPartial<RolesOrmEntity> {
    return RoleMapper.toOrm(domain);
  }

  // Overridden so reads hydrate permissions; the base implementations fetch no relations.
  async findById(id: string): Promise<Role | null> {
    const entity = await this.ormRepository.findOne({
      where: { id },
      relations: ROLE_RELATIONS,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Role[]> {
    const entities = await this.ormRepository.find({
      relations: ROLE_RELATIONS,
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    // `role_permissions` has no unique constraint on (role_id, permission_id),
    // so the duplicate has to be ruled out before inserting.
    const existing = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permissionId } },
    });
    if (existing) {
      return;
    }

    const link = this.rolePermissionRepository.create({
      role: { id: roleId },
      permission: { id: permissionId },
    });
    await this.rolePermissionRepository.save(link);
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    const existing = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permissionId } },
    });
    if (!existing) {
      return;
    }

    await this.rolePermissionRepository.remove(existing);
  }
}
