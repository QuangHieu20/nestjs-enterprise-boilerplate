import { UnauthorizedException } from '@nestjs/common';
import { GoogleLoginUseCase } from './google-login.use-case';
import { IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { IIdentityManager } from '@modules/auth/application/ports/identity-manager.interface';
import { User } from '@modules/user/domain/entities/user.entity';
import { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';

describe('GoogleLoginUseCase', () => {
  let useCase: GoogleLoginUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let identityManager: jest.Mocked<IIdentityManager>;

  const profile: GoogleVerifiedProfile = {
    sub: 'google-sub-1',
    email: 'Existing@Example.com',
    emailVerified: true,
    displayName: 'Existing User',
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
    useCase = new GoogleLoginUseCase(userRepository, identityManager);
  });

  it('rejects when no account exists for the email', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(profile, response)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(identityManager.issue).not.toHaveBeenCalled();
  });

  it('rejects when the account is inactive', async () => {
    userRepository.findByEmail.mockResolvedValue(
      new User({ email: 'existing@example.com', isActive: false }),
    );

    await expect(useCase.execute(profile, response)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('links the Google identity on first Google login for an unlinked account', async () => {
    const existing = new User(
      { email: 'existing@example.com', password: 'hashed', isActive: true },
      'user-id-1',
    );
    userRepository.findByEmail.mockResolvedValue(existing);
    userRepository.save.mockImplementation((u) => Promise.resolve(u));
    identityManager.issue.mockResolvedValue({
      sub: 'user-id-1',
      email: 'existing@example.com',
      displayName: '',
    });

    await useCase.execute(profile, response);

    expect(userRepository.save).toHaveBeenCalled();
    const saved = userRepository.save.mock.calls[0][0];
    expect(saved.googleId).toBe('google-sub-1');
    expect(identityManager.issue).toHaveBeenCalled();
  });

  it('issues a session directly when the account is already linked', async () => {
    const linked = new User(
      {
        email: 'existing@example.com',
        isActive: true,
        googleId: 'google-sub-1',
      },
      'user-id-1',
    );
    userRepository.findByEmail.mockResolvedValue(linked);
    identityManager.issue.mockResolvedValue({
      sub: 'user-id-1',
      email: 'existing@example.com',
      displayName: '',
    });

    await useCase.execute(profile, response);

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(identityManager.issue).toHaveBeenCalledWith(linked, response);
  });
});
