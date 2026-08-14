import type { RefreshToken } from '@modules/auth/domain/entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  findByJti(jti: string): Promise<RefreshToken | null>;

  save(token: RefreshToken): Promise<RefreshToken>;

  /**
   * Revokes every still-live token in the family. Used both on logout and on
   * reuse detection, where the whole chain must die at once.
   */
  revokeFamily(familyId: string): Promise<void>;
}
