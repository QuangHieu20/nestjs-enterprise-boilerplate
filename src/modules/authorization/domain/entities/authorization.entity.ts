import { BaseEntity } from '@shared/domain/base.entity';
import { PermissionRule } from '@modules/access-control/domain/types/app-ability.type';

export interface AuthorizationProps {
  permissions: PermissionRule[];
}

export class Authorization extends BaseEntity {
  private _permissions: PermissionRule[];

  constructor(props: AuthorizationProps, id?: string) {
    super(id);
    this._permissions = props.permissions;
  }

  get permissions(): PermissionRule[] {
    return this._permissions;
  }
}
