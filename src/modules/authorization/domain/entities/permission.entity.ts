import { BaseEntity } from '@shared/domain/base.entity';
import { Action } from '@modules/access-control/domain/enums/action.enum';

import { AppSubject } from '@modules/access-control/domain/types/app-subject.type';
import { PermissionRule } from '@modules/access-control/domain/types/app-ability.type';

export class Permission extends BaseEntity {
  private readonly _action: Action;

  private readonly _subject: AppSubject;

  constructor(props: PermissionRule, id?: string) {
    super(id);

    this._action = props.action;
    this._subject = props.subject;
  }

  get action(): Action {
    return this._action;
  }

  get subject(): AppSubject {
    return this._subject;
  }
}
