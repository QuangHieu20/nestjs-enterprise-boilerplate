import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { USER_REPOSITORY } from '@modules/user/application/ports/tokens';
import { type IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { User } from '@modules/user/domain/entities/user.entity';
import { IDENTITY_MANAGER } from '@modules/auth/application/ports/tokens';
import { type IIdentityManager } from '@modules/auth/application/ports/identity-manager.interface';
import type { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';
import type { AuthPayload } from '@shared/interfaces/auth.interface';

@Injectable()
export class GoogleRegisterUseCase {
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

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('auth.register.email_taken');
    }

    const newUser = User.createFromGoogle({
      email,
      displayName: profile.displayName,
      googleId: profile.sub,
    });

    let savedUser: User;
    try {
      savedUser = await this.userRepository.save(newUser);
    } catch (error) {
      // 23505 = unique_violation: another request won the race between the
      // findByEmail check above and this insert.
      const driverError = (error as QueryFailedError).driverError as
        { code?: string } | undefined;
      if (error instanceof QueryFailedError && driverError?.code === '23505') {
        throw new ConflictException('auth.register.email_taken');
      }
      throw error;
    }

    return this.identityManager.issue(savedUser, response);
  }
}
