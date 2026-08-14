import { randomUUID } from 'crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { IIdentityManager } from '@modules/auth/application/ports/identity-manager.interface';
import { type IRefreshTokenRepository } from '@modules/auth/application/ports/refresh-token.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '@modules/auth/application/ports/tokens';
import { RefreshToken } from '@modules/auth/domain/entities/refresh-token.entity';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@modules/auth/domain/types/token-payload.type';
import { USER_REPOSITORY } from '@modules/user/application/ports/tokens';
import { type IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { User } from '@modules/user/domain/entities/user.entity';
import { AuthPayload } from '@shared/interfaces/auth.interface';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};
const DURATION_PATTERN = /^(\d+)\s*(ms|s|m|h|d|w)?$/i;

/**
 * Supports the `ms`-style subset the JWT env vars actually use. A bare number is
 * seconds, matching jsonwebtoken. Throws at construction so a typo in .env fails
 * the boot rather than the first login.
 */
function durationToMs(value: string, varName: string): number {
  const match = DURATION_PATTERN.exec(value.trim());
  if (!match) {
    throw new Error(
      `${varName} must look like "15m", "7d" or "900" (got "${value}")`,
    );
  }
  return Number(match[1]) * UNIT_TO_MS[(match[2] ?? 's').toLowerCase()];
}

@Injectable()
export class JwtIdentityManager implements IIdentityManager {
  private readonly accessTtlMs: number;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {
    this.accessTtlMs = durationToMs(
      configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
      'JWT_ACCESS_EXPIRES_IN',
    );
    this.refreshTtlMs = durationToMs(
      configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      'JWT_REFRESH_EXPIRES_IN',
    );
  }

  async issue(user: User, response: Response): Promise<AuthPayload> {
    return this.issueSession(user, response, randomUUID());
  }

  async revoke(
    user: User,
    request: Request,
    response: Response,
  ): Promise<void> {
    const token = request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (token) {
      try {
        const payload =
          await this.jwtService.verifyAsync<RefreshTokenPayload>(token);
        if (payload?.type === 'refresh' && payload.family_id) {
          await this.refreshTokenRepository.revokeFamily(payload.family_id);
        }
      } catch {
        // An unreadable cookie still has to end the session client-side.
      }
    }
    this.clearAuthCookies(response);
  }

  async verify(request: Request): Promise<User | null> {
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    if (!token) return null;

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      return null;
    }

    if (payload?.type !== 'access') return null;

    // Hitting the DB per request is deliberate: without it a ban or a delete only
    // takes effect once the access token expires on its own.
    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) return null;

    return user;
  }

  async refresh(request: Request, response: Response): Promise<AuthPayload> {
    const token = request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!token) {
      throw new UnauthorizedException('auth.token.refresh_missing');
    }

    const payload = await this.verifyRefreshToken(token);
    const stored = await this.refreshTokenRepository.findByJti(payload.jti);

    // A valid signature over a jti that is unknown or already rotated means the
    // token leaked and is being replayed: burn the whole family, so the thief and
    // the victim both have to re-authenticate.
    if (!stored || stored.isRevoked) {
      await this.refreshTokenRepository.revokeFamily(payload.family_id);
      throw new UnauthorizedException('auth.token.reuse_detected');
    }

    if (stored.isExpired()) {
      throw new UnauthorizedException('auth.token.refresh_expired_or_invalid');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('auth.token.refresh_expired_or_invalid');
    }

    stored.revoke();
    await this.refreshTokenRepository.save(stored);

    return this.issueSession(user, response, stored.familyId);
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('auth.token.refresh_expired_or_invalid');
    }

    if (payload?.type !== 'refresh' || !payload.jti || !payload.family_id) {
      throw new UnauthorizedException('auth.token.refresh_invalid');
    }
    return payload;
  }

  private async issueSession(
    user: User,
    response: Response,
    familyId: string,
  ): Promise<AuthPayload> {
    const jti = randomUUID();

    await this.refreshTokenRepository.save(
      new RefreshToken({
        userId: user.id,
        jti,
        familyId,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      }),
    );

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      type: 'access',
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti,
      family_id: familyId,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: Math.floor(this.accessTtlMs / 1000),
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: Math.floor(this.refreshTtlMs / 1000),
    });

    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      this.cookieOptions(this.accessTtlMs),
    );
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      this.cookieOptions(this.refreshTtlMs),
    );

    return {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  /** maxAge is derived from the same TTL used to sign, so a cookie can never
   * outlive its token (or die before it). */
  private cookieOptions(maxAgeMs: number): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAgeMs,
    };
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE);
    response.clearCookie(REFRESH_TOKEN_COOKIE);
  }
}
