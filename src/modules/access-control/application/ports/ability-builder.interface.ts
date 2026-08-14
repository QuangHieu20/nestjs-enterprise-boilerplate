import { PermissionRule } from '@modules/access-control/domain/types/app-ability.type';
import { IAuthorizationChecker } from '@modules/access-control/application/ports/authorization-checker.interface';

export interface IAbilityBuilder {
  build(permissions: PermissionRule[]): IAuthorizationChecker;
}
