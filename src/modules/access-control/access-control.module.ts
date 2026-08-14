import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { PoliciesGuard } from '@modules/access-control/presentation/guards/policies.guard';
import { APP_GUARD } from '@nestjs/core';
import { AbilityFactory } from '@modules/access-control/application/factories/ability.factory';
import { ABILITY_BUILDER } from '@modules/access-control/application/ports/tokens';
import { CaslAbilityBuilderAdapter } from '@modules/access-control/infrastructure/adapters/casl-ability-builder.adapter';

@Module({
  imports: [AuthorizationModule],
  providers: [
    AbilityFactory,
    PoliciesGuard,
    { provide: ABILITY_BUILDER, useClass: CaslAbilityBuilderAdapter },
    {
      provide: APP_GUARD,
      useExisting: PoliciesGuard,
    },
  ],
})
export class AccessControlModule {}
