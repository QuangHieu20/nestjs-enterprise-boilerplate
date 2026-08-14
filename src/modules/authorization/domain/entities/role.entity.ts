import { BaseEntity } from '@shared/domain/base.entity';
import { Permission } from './permission.entity';

export interface RoleProps {
  name: string;
  permissions: Permission[];
}

export class Role extends BaseEntity {
  private readonly _name: string;
  private readonly _permissions: Permission[];

  constructor(props: RoleProps, id?: string) {
    super(id);

    this._name = props.name;
    this._permissions = props.permissions;
  }

  get name(): string {
    return this._name;
  }

  get permissions(): Permission[] {
    return this._permissions;
  }
}
