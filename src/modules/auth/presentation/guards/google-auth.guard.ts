import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { GoogleAuthDto } from '@modules/auth/application/dtos/google-auth.dto';
import { SOCIAL_IDENTITY_VERIFIER } from '@modules/auth/application/ports/tokens';
import { type ISocialIdentityVerifier } from '@modules/auth/application/ports/social-identity-verifier.interface';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
  constructor(
    @Inject(SOCIAL_IDENTITY_VERIFIER)
    private readonly verifier: ISocialIdentityVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // The guard runs before the ValidationPipe, so the body is still unvalidated.
    const request = context
      .switchToHttp()
      .getRequest<Request<unknown, unknown, Partial<GoogleAuthDto>>>();
    const credential = request.body?.credential;

    if (!credential || typeof credential !== 'string') {
      throw new UnauthorizedException('auth.google.credential_missing');
    }

    let profile;
    try {
      profile = await this.verifier.verify(credential);
    } catch {
      throw new UnauthorizedException('auth.google.credential_invalid');
    }

    if (!profile.emailVerified) {
      throw new UnauthorizedException('auth.google.email_not_verified');
    }

    request.socialUser = profile;
    return true;
  }
}
