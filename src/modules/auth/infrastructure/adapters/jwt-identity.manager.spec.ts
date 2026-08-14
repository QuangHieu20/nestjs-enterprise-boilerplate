import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { JwtIdentityManager } from './jwt-identity.manager';
import { IRefreshTokenRepository } from '@modules/auth/application/ports/refresh-token.repository.interface';
import { RefreshToken } from '@modules/auth/domain/entities/refresh-token.entity';
import { IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { User } from '@modules/user/domain/entities/user.entity';

const SECRET = 'test-secret';

interface DecodedToken {
  sub: string;
  type: string;
  jti?: string;
  family_id?: string;
  email?: string;
  displayName?: string;
  iat: number;
  exp: number;
}

class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  readonly rows = new Map<string, RefreshToken>();

  findByJti(jti: string): Promise<RefreshToken | null> {
    return Promise.resolve(this.rows.get(jti) ?? null);
  }

  save(token: RefreshToken): Promise<RefreshToken> {
    this.rows.set(token.jti, token);
    return Promise.resolve(token);
  }

  revokeFamily(familyId: string): Promise<void> {
    for (const row of this.rows.values()) {
      if (row.familyId === familyId) row.revoke();
    }
    return Promise.resolve();
  }
}

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

type CookieJar = Record<string, { value: string; options: CookieOptions }>;

function makeResponse() {
  const jar: CookieJar = {};
  const cookie = jest.fn(
    (name: string, value: string, options: CookieOptions) => {
      jar[name] = { value, options };
    },
  );
  const clearCookie = jest.fn();
  const response = { cookie, clearCookie } as unknown as Response;
  return { response, jar, cookie, clearCookie };
}

function makeRequest(cookies: Record<string, string>): Request {
  return { cookies } as unknown as Request;
}

/**
 * A real JwtService is used on purpose: these tests exist to prove a token this
 * manager itself signed cannot be replayed in the wrong slot. Mocking the
 * verification away would assume the bug out of existence.
 */
describe('JwtIdentityManager', () => {
  let jwtService: JwtService;
  let userRepository: jest.Mocked<IUserRepository>;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let manager: JwtIdentityManager;

  const activeUser = new User(
    { email: 'user@example.com', displayName: 'Real Name', isActive: true },
    'user-1',
  );

  const build = (config: ConfigService = makeConfig()) =>
    new JwtIdentityManager(jwtService, config, userRepository, refreshTokens);

  const decode = (token: string): DecodedToken =>
    jwtService.decode<DecodedToken>(token);

  /** Logs in and returns the cookies that login handed out. */
  const login = async () => {
    const { response, jar } = makeResponse();
    await manager.issue(activeUser, response);
    return { access: jar.access_token.value, refresh: jar.refresh_token.value };
  };

  beforeEach(() => {
    jwtService = new JwtService({ secret: SECRET });
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue(activeUser),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };
    refreshTokens = new InMemoryRefreshTokenRepository();
    manager = build();
  });

  describe('token type confusion', () => {
    it('refuses an access token presented as a refresh token', async () => {
      const { access } = await login();
      const findByJti = jest.spyOn(refreshTokens, 'findByJti');

      await expect(
        manager.refresh(
          makeRequest({ refresh_token: access }),
          makeResponse().response,
        ),
      ).rejects.toThrow(UnauthorizedException);

      // Rejected on the claims alone — it never reached the token store.
      expect(findByJti).not.toHaveBeenCalled();
    });

    it('refuses a non-refresh token even when it carries a live jti', async () => {
      const { refresh } = await login();
      const live = decode(refresh);

      // Same secret, same stored jti, same family — only `type` is wrong. This is
      // the claim that separates the two tokens once their payloads overlap.
      const disguised = jwtService.sign({
        sub: 'user-1',
        jti: live.jti,
        family_id: live.family_id,
        type: 'access',
      });

      await expect(
        manager.refresh(
          makeRequest({ refresh_token: disguised }),
          makeResponse().response,
        ),
      ).rejects.toThrow(UnauthorizedException);

      // The genuine token survives: a rejected impostor is not a reuse event.
      expect(refreshTokens.rows.get(live.jti!)?.isRevoked).toBe(false);
    });

    it('refuses a refresh token presented as an access token', async () => {
      const { refresh } = await login();

      await expect(
        manager.verify(makeRequest({ access_token: refresh })),
      ).resolves.toBeNull();
      expect(userRepository.findById.mock.calls).toHaveLength(0);
    });

    it('stamps the type claim on each token', async () => {
      const { access, refresh } = await login();

      expect(decode(access)).toMatchObject({ type: 'access', sub: 'user-1' });
      expect(decode(refresh)).toMatchObject({ type: 'refresh', sub: 'user-1' });
    });

    it('keeps identity details out of the refresh token payload', async () => {
      const payload = decode((await login()).refresh);

      expect(payload.email).toBeUndefined();
      expect(payload.displayName).toBeUndefined();
      expect(payload.jti).toEqual(expect.any(String));
      expect(payload.family_id).toEqual(expect.any(String));
    });
  });

  describe('verify() consults the database', () => {
    it('returns null for a banned user holding a still-valid token', async () => {
      const { access } = await login();
      userRepository.findById.mockResolvedValue(
        new User({ email: 'user@example.com', isActive: false }, 'user-1'),
      );

      await expect(
        manager.verify(makeRequest({ access_token: access })),
      ).resolves.toBeNull();
    });

    it('returns null for a deleted user holding a still-valid token', async () => {
      const { access } = await login();
      userRepository.findById.mockResolvedValue(null);

      await expect(
        manager.verify(makeRequest({ access_token: access })),
      ).resolves.toBeNull();
    });

    it('returns the database user rather than the token payload', async () => {
      const { access } = await login();
      const renamed = new User(
        {
          email: 'user@example.com',
          displayName: 'Renamed In Db',
          isActive: true,
        },
        'user-1',
      );
      userRepository.findById.mockResolvedValue(renamed);

      const result = await manager.verify(
        makeRequest({ access_token: access }),
      );

      expect(result).toBe(renamed);
      expect(result?.displayName).toBe('Renamed In Db');
    });

    it('returns null when no access cookie is present', async () => {
      await expect(manager.verify(makeRequest({}))).resolves.toBeNull();
    });

    it('returns null for a token signed with a foreign secret', async () => {
      const forged = new JwtService({ secret: 'attacker-secret' }).sign({
        sub: 'user-1',
        type: 'access',
      });

      await expect(
        manager.verify(makeRequest({ access_token: forged })),
      ).resolves.toBeNull();
    });
  });

  describe('refresh() consults the database', () => {
    it('throws for a banned user', async () => {
      const { refresh } = await login();
      userRepository.findById.mockResolvedValue(
        new User({ email: 'user@example.com', isActive: false }, 'user-1'),
      );

      await expect(
        manager.refresh(
          makeRequest({ refresh_token: refresh }),
          makeResponse().response,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws for a deleted user', async () => {
      const { refresh } = await login();
      userRepository.findById.mockResolvedValue(null);

      await expect(
        manager.refresh(
          makeRequest({ refresh_token: refresh }),
          makeResponse().response,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the refresh cookie is missing', async () => {
      await expect(
        manager.refresh(makeRequest({}), makeResponse().response),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('rotation', () => {
    it('revokes the old jti and issues a new one in the same family', async () => {
      const { refresh } = await login();
      const old = decode(refresh);

      const next = makeResponse();
      await manager.refresh(
        makeRequest({ refresh_token: refresh }),
        next.response,
      );
      const rotated = decode(next.jar.refresh_token.value);

      expect(rotated.jti).not.toBe(old.jti);
      expect(rotated.family_id).toBe(old.family_id);
      expect(refreshTokens.rows.get(old.jti!)?.isRevoked).toBe(true);
      expect(refreshTokens.rows.get(rotated.jti!)?.isRevoked).toBe(false);
    });

    it('starts a separate family per login', async () => {
      const a = decode((await login()).refresh);
      const b = decode((await login()).refresh);

      expect(a.family_id).not.toBe(b.family_id);
    });
  });

  describe('reuse detection', () => {
    it('burns the whole family when a rotated token is replayed', async () => {
      const { refresh: stolen } = await login();
      const familyId = decode(stolen).family_id;

      // Victim rotates normally.
      const next = makeResponse();
      await manager.refresh(
        makeRequest({ refresh_token: stolen }),
        next.response,
      );
      const stillLive = next.jar.refresh_token.value;

      // Thief replays the token the victim already spent.
      await expect(
        manager.refresh(
          makeRequest({ refresh_token: stolen }),
          makeResponse().response,
        ),
      ).rejects.toThrow(UnauthorizedException);

      const family = [...refreshTokens.rows.values()].filter(
        (row) => row.familyId === familyId,
      );
      expect(family).toHaveLength(2);
      expect(family.every((row) => row.isRevoked)).toBe(true);

      // The victim's unused token is collateral damage: the session is over.
      await expect(
        manager.refresh(
          makeRequest({ refresh_token: stillLive }),
          makeResponse().response,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a well-signed token whose jti was never stored', async () => {
      const orphan = jwtService.sign({
        sub: 'user-1',
        jti: 'never-issued',
        family_id: 'ghost-family',
        type: 'refresh',
      });

      await expect(
        manager.refresh(
          makeRequest({ refresh_token: orphan }),
          makeResponse().response,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('does not issue new tokens when reuse is detected', async () => {
      const { refresh: stolen } = await login();
      await manager.refresh(
        makeRequest({ refresh_token: stolen }),
        makeResponse().response,
      );

      const attacker = makeResponse();
      await expect(
        manager.refresh(
          makeRequest({ refresh_token: stolen }),
          attacker.response,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(attacker.cookie).not.toHaveBeenCalled();
    });
  });

  describe('revoke()', () => {
    it('revokes the whole family and clears both cookies', async () => {
      const { refresh } = await login();
      await manager.refresh(
        makeRequest({ refresh_token: refresh }),
        makeResponse().response,
      );

      const logout = makeResponse();
      await manager.revoke(
        activeUser,
        makeRequest({ refresh_token: refresh }),
        logout.response,
      );

      expect([...refreshTokens.rows.values()].every((r) => r.isRevoked)).toBe(
        true,
      );
      expect(logout.clearCookie).toHaveBeenCalledWith('access_token');
      expect(logout.clearCookie).toHaveBeenCalledWith('refresh_token');
    });

    it('makes a logged-out refresh token unusable', async () => {
      const { refresh } = await login();

      await manager.revoke(
        activeUser,
        makeRequest({ refresh_token: refresh }),
        makeResponse().response,
      );

      await expect(
        manager.refresh(
          makeRequest({ refresh_token: refresh }),
          makeResponse().response,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('still clears cookies when the refresh cookie is unreadable', async () => {
      const logout = makeResponse();
      await manager.revoke(
        activeUser,
        makeRequest({ refresh_token: 'junk' }),
        logout.response,
      );

      expect(logout.clearCookie).toHaveBeenCalledWith('access_token');
      expect(logout.clearCookie).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('configured lifetimes', () => {
    it('derives cookie maxAge and token exp from the same env value', async () => {
      manager = build(
        makeConfig({
          JWT_ACCESS_EXPIRES_IN: '1h',
          JWT_REFRESH_EXPIRES_IN: '30d',
        }),
      );

      const { response, jar } = makeResponse();
      await manager.issue(activeUser, response);

      expect(jar.access_token.options.maxAge).toBe(3_600_000);
      expect(jar.refresh_token.options.maxAge).toBe(2_592_000_000);

      const access = decode(jar.access_token.value);
      const refresh = decode(jar.refresh_token.value);
      expect(access.exp - access.iat).toBe(3_600);
      expect(refresh.exp - refresh.iat).toBe(2_592_000);
    });

    it('marks auth cookies httpOnly and sameSite strict', async () => {
      const { response, jar } = makeResponse();
      await manager.issue(activeUser, response);

      for (const name of ['access_token', 'refresh_token']) {
        expect(jar[name].options).toMatchObject({
          httpOnly: true,
          sameSite: 'strict',
        });
      }
    });

    it('fails fast on an unparseable duration', () => {
      expect(() =>
        build(makeConfig({ JWT_ACCESS_EXPIRES_IN: 'banana' })),
      ).toThrow(/JWT_ACCESS_EXPIRES_IN/);
    });
  });
});
