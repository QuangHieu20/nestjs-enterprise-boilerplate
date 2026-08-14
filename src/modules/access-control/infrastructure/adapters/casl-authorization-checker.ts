import { IAuthorizationChecker } from '../../application/ports/authorization-checker.interface';
import { AppAbility } from '../../domain/types/app-ability.type';
import { Action } from '@modules/access-control/domain/enums/action.enum';
import { AppSubject } from '@modules/access-control/domain/types/app-subject.type';

export class CaslAuthorizationChecker implements IAuthorizationChecker {
  constructor(private readonly ability: AppAbility) {}

  // CASL evaluates in-memory, but the port stays Promise-based so other
  // implementations can check against a remote policy service.
  can(action: Action, subject: AppSubject): Promise<boolean> {
    return Promise.resolve(this.ability.can(action, subject));
  }

  cannot(action: Action, subject: AppSubject): Promise<boolean> {
    return Promise.resolve(this.ability.cannot(action, subject));
  }
}
