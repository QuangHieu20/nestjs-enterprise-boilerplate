import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { IAbilityBuilder } from '../../application/ports/ability-builder.interface';
import { CaslAuthorizationChecker } from './casl-authorization-checker';
import {
  AppAbility,
  PermissionRule,
} from '../../domain/types/app-ability.type';

@Injectable()
export class CaslAbilityBuilderAdapter implements IAbilityBuilder {
  build(permissions: PermissionRule[]): CaslAuthorizationChecker {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    for (const p of permissions) can(p.action, p.subject);
    return new CaslAuthorizationChecker(build());
  }
}
