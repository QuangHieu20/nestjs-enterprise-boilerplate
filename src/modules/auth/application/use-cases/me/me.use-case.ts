import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUseCase } from '@shared/application/use-case.interface';

import type { User } from '@modules/user/domain/entities/user.entity';
import { AUTHORIZATION_REPOSITORY } from '@modules/authorization/application/ports/tokens';
import { type IAuthorizationRepository } from '@modules/authorization/application/ports/authorization.repository.interface';
import type { Authorization } from '@modules/authorization/domain/entities/authorization.entity';

@Injectable()
export class MeUseCase implements IUseCase<
  { user: User },
  Authorization | null
> {
  constructor(
    @Inject(AUTHORIZATION_REPOSITORY)
    private readonly authorization: IAuthorizationRepository,
  ) {}

  async execute({ user }: { user: User }): Promise<Authorization | null> {
    if (!user) throw new UnauthorizedException();
    return this.authorization.findAuthorizationByUserId(user.id);
  }
}
