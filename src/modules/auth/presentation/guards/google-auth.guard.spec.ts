import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';
import { ISocialIdentityVerifier } from '@modules/auth/application/ports/social-identity-verifier.interface';
import { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;
  let verifier: jest.Mocked<ISocialIdentityVerifier>;

  const buildContext = (body: any): ExecutionContext => {
    const request = { body };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    verifier = { verify: jest.fn() };
    guard = new GoogleAuthGuard(verifier);
  });

  it('rejects a missing credential', async () => {
    await expect(guard.canActivate(buildContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('rejects a blank credential', async () => {
    await expect(
      guard.canActivate(buildContext({ credential: '' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the verifier throws', async () => {
    verifier.verify.mockRejectedValue(new Error('invalid token'));
    await expect(
      guard.canActivate(buildContext({ credential: 'bad-token' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the Google email is not verified', async () => {
    const profile: GoogleVerifiedProfile = {
      sub: 'google-sub',
      email: 'user@example.com',
      emailVerified: false,
    };
    verifier.verify.mockResolvedValue(profile);

    await expect(
      guard.canActivate(buildContext({ credential: 'token' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the verified profile and allows the request through', async () => {
    const profile: GoogleVerifiedProfile = {
      sub: 'google-sub',
      email: 'user@example.com',
      emailVerified: true,
      displayName: 'Jane Doe',
    };
    verifier.verify.mockResolvedValue(profile);

    const request: any = { body: { credential: 'token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.socialUser).toEqual(profile);
  });
});
