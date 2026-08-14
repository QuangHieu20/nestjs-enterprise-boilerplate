import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { GoogleRegisterUseCase } from './google-register.use-case';
import { IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { IIdentityManager } from '@modules/auth/application/ports/identity-manager.interface';
import { User } from '@modules/user/domain/entities/user.entity';
import { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';

describe('GoogleRegisterUseCase', () => {
  let useCase: GoogleRegisterUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let identityManager: jest.Mocked<IIdentityManager>;

  const profile: GoogleVerifiedProfile = {
    sub: 'google-sub-1',
    email: 'NewUser@Example.com',
    emailVerified: true,
    displayName: 'New User',
  };
  const response: any = {};

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };
    identityManager = {
      issue: jest.fn(),
      revoke: jest.fn(),
      refresh: jest.fn(),
      verify: jest.fn(),
    };
    useCase = new GoogleRegisterUseCase(userRepository, identityManager);
  });

  it('rejects when an account already exists for the email', async () => {
    userRepository.findByEmail.mockResolvedValue(
      new User({ email: 'newuser@example.com' }),
    );

    await expect(useCase.execute(profile, response)).rejects.toThrow(
      ConflictException,
    );
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('creates a Google-origin account (no password) and issues a session', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    const savedUser = new User(
      {
        email: 'newuser@example.com',
        displayName: 'New User',
        googleId: 'google-sub-1',
        provider: 'google',
      },
      'user-id-1',
    );
    userRepository.save.mockResolvedValue(savedUser);
    identityManager.issue.mockResolvedValue({
      sub: 'user-id-1',
      email: 'newuser@example.com',
      displayName: 'New User',
    });

    await useCase.execute(profile, response);

    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      'newuser@example.com',
    );
    const created = userRepository.save.mock.calls[0][0];
    expect(created.password).toBeUndefined();
    expect(created.provider).toBe('google');
    expect(created.googleId).toBe('google-sub-1');
    expect(identityManager.issue).toHaveBeenCalledWith(savedUser, response);
  });

  it('translates a unique-constraint violation on save into a conflict', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    const dbError = new QueryFailedError('INSERT', [], new Error('duplicate'));
    (dbError as any).driverError = { code: '23505' };
    userRepository.save.mockRejectedValue(dbError);

    await expect(useCase.execute(profile, response)).rejects.toThrow(
      ConflictException,
    );
  });
});
