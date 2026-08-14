import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { USER_REPOSITORY } from '@modules/user/application/ports/tokens';
import { type IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { IDENTITY_MANAGER } from '@modules/auth/application/ports/tokens';
import { type IIdentityManager } from '@modules/auth/application/ports/identity-manager.interface';
import type { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';
import type { AuthPayload } from '@shared/interfaces/auth.interface';

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(IDENTITY_MANAGER)
    private readonly identityManager: IIdentityManager,
  ) {}

  async execute(
    profile: GoogleVerifiedProfile,
    response: Response,
  ): Promise<AuthPayload> {
    const email = profile.email.trim().toLowerCase();

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('auth.google.account_not_found');
    }

    if (!user.isActive) {
      // Shared key with credential sign-in (FR-009b) — one wording, two flows.
      throw new UnauthorizedException('auth.login.account_locked');
    }

    let currentUser = user;
    if (!currentUser.googleId) {
      currentUser.linkGoogle(profile.sub);
      currentUser = await this.userRepository.save(currentUser);
    }

    return this.identityManager.issue(currentUser, response);
  }
}
