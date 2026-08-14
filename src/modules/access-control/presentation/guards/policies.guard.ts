import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  CHECK_POLICIES_KEY,
  PolicyMetadata,
} from '../decorators/check-policies.decorator';

import { AUTHORIZATION_REPOSITORY } from '@modules/authorization/application/ports/tokens';
import { type IAuthorizationRepository } from '@modules/authorization/application/ports/authorization.repository.interface';
import { AbilityFactory } from '@modules/access-control/application/factories/ability.factory';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
    @Inject(AUTHORIZATION_REPOSITORY)
    private readonly authorizationRepository: IAuthorizationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<PolicyMetadata>(
      CHECK_POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );
    // Allow access if endpoint does not declare @CheckPolicies()
    if (!policy) {
      return true;
    }

    // `user` is populated upstream by the auth guard; absent means unauthenticated.
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id: string } }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException();
    }

    const authorization =
      await this.authorizationRepository.findAuthorizationByUserId(user.id);

    if (!authorization || !authorization.permissions) {
      throw new ForbiddenException();
    }
    const ability = this.abilityFactory.create(authorization.permissions);

    return ability.can(policy.action, policy.subject);
  }
}
