import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RolesOrmEntity } from './roles.orm-entity';
import { PermissionOrmEntity } from './permissions.orm-entity';

@Entity('role_permissions')
export class RolePermissionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RolesOrmEntity)
  @JoinColumn({ name: 'role_id' })
  role: RolesOrmEntity;

  @ManyToOne(() => PermissionOrmEntity)
  @JoinColumn({ name: 'permission_id' })
  permission: PermissionOrmEntity;
}
