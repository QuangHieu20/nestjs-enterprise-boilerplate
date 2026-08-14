import { Injectable, Inject } from '@nestjs/common';
import type { Request, Response } from 'express';
import { IUseCase } from '@shared/application/use-case.interface';
import { IDENTITY_MANAGER } from '@modules/auth/application/ports/tokens';
import { type IIdentityManager } from '@modules/auth/application/ports/identity-manager.interface';
import { AuthPayload } from '@shared/interfaces/auth.interface';

@Injectable()
export class RefreshUseCase implements IUseCase<
  { request: Request; response: Response },
  AuthPayload
> {
  constructor(
    @Inject(IDENTITY_MANAGER)
    private readonly identityManager: IIdentityManager,
  ) {}

  async execute(dto: {
    request: Request;
    response: Response;
  }): Promise<AuthPayload> {
    return this.identityManager.refresh(dto.request, dto.response);
  }
}
