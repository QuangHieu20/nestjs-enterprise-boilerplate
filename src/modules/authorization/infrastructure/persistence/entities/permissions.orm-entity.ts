import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { RolePermissionOrmEntity } from './role-permission.orm-entity';

import { Action } from '@modules/access-control/domain/enums/action.enum';
import type { AppSubject } from '@modules/access-control/domain/types/app-subject.type';

@Entity('permissions')
export class PermissionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
  })
  action: Action;

  @Column({
    type: 'varchar',
  })
  subject: AppSubject;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RolePermissionOrmEntity, (rp) => rp.permission)
  rolePermissions: RolePermissionOrmEntity[];
}
