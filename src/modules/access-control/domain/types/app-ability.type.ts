import { MongoAbility } from '@casl/ability';
import { Action } from '../enums/action.enum';
import { AppSubject } from './app-subject.type';

export interface PermissionRule {
  action: Action;

  subject: AppSubject;
}

export type AppAbility = MongoAbility<[Action, AppSubject]>;
