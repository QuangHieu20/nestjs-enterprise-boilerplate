import { SetMetadata } from '@nestjs/common';
import { Action } from '../../domain/enums/action.enum';
import { AppSubject } from '../../domain/types/app-subject.type';

export const CHECK_POLICIES_KEY = 'check_policies';

export interface PolicyMetadata {
  action: Action;
  subject: AppSubject;
}

export const CheckPolicies = (action: Action, subject: AppSubject) =>
  SetMetadata(CHECK_POLICIES_KEY, { action, subject });
