import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { ISocialIdentityVerifier } from '@modules/auth/application/ports/social-identity-verifier.interface';
import { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';

@Injectable()
export class GoogleIdentityVerifier implements ISocialIdentityVerifier {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')!;
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(credential: string): Promise<GoogleVerifiedProfile> {
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('auth.google.credential_invalid');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('auth.google.credential_invalid');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
      displayName: payload.name,
      picture: payload.picture,
    };
  }
}
