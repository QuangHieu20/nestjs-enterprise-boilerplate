import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleIdentityVerifier } from './google-identity.verifier';

const verifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken,
  })),
}));

describe('GoogleIdentityVerifier', () => {
  let verifier: GoogleIdentityVerifier;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    verifyIdToken.mockReset();
    configService = {
      get: jest
        .fn()
        .mockReturnValue('test-client-id.apps.googleusercontent.com'),
    } as unknown as jest.Mocked<ConfigService>;
    verifier = new GoogleIdentityVerifier(configService);
  });

  it('maps a valid payload to a GoogleVerifiedProfile', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-1',
        email: 'user@example.com',
        email_verified: true,
        name: 'Jane Doe',
        picture: 'https://example.com/pic.png',
        aud: 'test-client-id.apps.googleusercontent.com',
      }),
    });

    const profile = await verifier.verify('valid-token');

    expect(profile).toEqual({
      sub: 'google-sub-1',
      email: 'user@example.com',
      emailVerified: true,
      displayName: 'Jane Doe',
      picture: 'https://example.com/pic.png',
    });
  });

  it('throws UnauthorizedException when the library rejects (invalid/expired/wrong audience)', async () => {
    verifyIdToken.mockRejectedValue(new Error('Wrong recipient'));

    await expect(verifier.verify('bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when the payload has no email', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-2',
        email_verified: true,
        aud: 'test-client-id.apps.googleusercontent.com',
      }),
    });

    await expect(verifier.verify('token-without-email')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
