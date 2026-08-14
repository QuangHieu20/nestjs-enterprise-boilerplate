import { Injectable, Inject } from '@nestjs/common';
import type { Request, Response } from 'express';
import { IUseCase } from '@shared/application/use-case.interface';
import { IDENTITY_MANAGER } from '@modules/auth/application/ports/tokens';
import { type IIdentityManager } from '@modules/auth/application/ports/identity-manager.interface';
import type { User } from '@modules/user/domain/entities/user.entity';

@Injectable()
export class LogoutUseCase implements IUseCase<
  { user: User; request: Request; response: Response },
  void
> {
  constructor(
    @Inject(IDENTITY_MANAGER)
    private readonly identityManager: IIdentityManager,
  ) {}

  async execute(dto: {
    user: User;
    request: Request;
    response: Response;
  }): Promise<void> {
    await this.identityManager.revoke(dto.user, dto.request, dto.response);
  }
}
