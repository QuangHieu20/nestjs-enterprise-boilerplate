import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermissionOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/role-permission.orm-entity';

@Entity('roles')
export class RolesOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RolePermissionOrmEntity, (rp) => rp.role)
  rolePermissions: RolePermissionOrmEntity[];
}
