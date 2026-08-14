import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRoleOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/user-role.orm-entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  password?: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', unique: true, nullable: true })
  googleId?: string;

  @Column({ type: 'varchar', default: 'local' })
  provider: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserRoleOrmEntity, (ur) => ur.user)
  role: UserRoleOrmEntity[];
}
