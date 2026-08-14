import { IRepository } from '@shared/domain/repository.interface';
import type { Role } from '../../domain/entities/role.entity';

export interface IRoleRepository extends IRepository<Role> {
  assignPermission(roleId: string, permissionId: string): Promise<void>;
  removePermission(roleId: string, permissionId: string): Promise<void>;
}
