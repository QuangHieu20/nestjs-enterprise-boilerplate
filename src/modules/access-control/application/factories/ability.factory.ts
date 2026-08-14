import { Inject, Injectable } from '@nestjs/common';

import { PermissionRule } from '@modules/access-control/domain/types/app-ability.type';
import { ABILITY_BUILDER } from '@modules/access-control/application/ports/tokens';
import type { IAbilityBuilder } from '@modules/access-control/application/ports/ability-builder.interface';
import { IAuthorizationChecker } from '@modules/access-control/application/ports/authorization-checker.interface';

@Injectable()
export class AbilityFactory {
  constructor(
    @Inject(ABILITY_BUILDER)
    private readonly builder: IAbilityBuilder,
  ) {}

  create(permissions: PermissionRule[]): IAuthorizationChecker {
    return this.builder.build(permissions);
  }
}
