import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../../dtos/login.dto';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
} from '@modules/user/application/ports/tokens';
import { type IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { type IPasswordHasher } from '@modules/user/application/ports/password-hasher.interface';
import type { Response } from 'express';
import type { AuthPayload } from '@shared/interfaces/auth.interface';
import { IDENTITY_MANAGER } from '@modules/auth/application/ports/tokens';
import { type IIdentityManager } from '@modules/auth/application/ports/identity-manager.interface';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(IDENTITY_MANAGER)
    private readonly identityManager: IIdentityManager,
  ) {}

  async execute(dto: LoginDto, response: Response): Promise<AuthPayload> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('auth.login.invalid_credentials');
    }

    const isPasswordValid = await this.passwordHasher.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('auth.login.invalid_credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('auth.login.account_locked');
    }

    return this.identityManager.issue(user, response);
  }
}
