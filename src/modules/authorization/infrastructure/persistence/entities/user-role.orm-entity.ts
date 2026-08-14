import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RolesOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/roles.orm-entity';
import { UserOrmEntity } from '@modules/user/infrastructure/persistence/entities/user.orm-entity';

@Entity('user_roles')
export class UserRoleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RolesOrmEntity)
  @JoinColumn({ name: 'role_id' })
  role: RolesOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
