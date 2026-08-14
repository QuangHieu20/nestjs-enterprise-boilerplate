import { BaseEntity } from '@shared/domain/base.entity';

export interface RefreshTokenProps {
  userId: string;
  jti: string;
  familyId: string;
  expiresAt: Date;
  revokedAt?: Date | null;
}

/**
 * One issued refresh token. Rotation replaces a row with a fresh `jti` inside the
 * same `familyId`; a family is the chain of tokens descending from a single login.
 */
export class RefreshToken extends BaseEntity {
  private readonly _userId: string;
  private readonly _jti: string;
  private readonly _familyId: string;
  private readonly _expiresAt: Date;
  private _revokedAt: Date | null;

  constructor(props: RefreshTokenProps, id?: string) {
    super(id);
    this._userId = props.userId;
    this._jti = props.jti;
    this._familyId = props.familyId;
    this._expiresAt = props.expiresAt;
    this._revokedAt = props.revokedAt ?? null;
  }

  get userId(): string {
    return this._userId;
  }

  get jti(): string {
    return this._jti;
  }

  get familyId(): string {
    return this._familyId;
  }

  get expiresAt(): Date {
    return new Date(this._expiresAt);
  }

  get revokedAt(): Date | null {
    return this._revokedAt ? new Date(this._revokedAt) : null;
  }

  get isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this._expiresAt.getTime() <= now.getTime();
  }

  /** Idempotent: re-revoking keeps the first revocation time, which is the one
   * that matters when reconstructing a token-theft timeline. */
  revoke(now: Date = new Date()): void {
    if (this._revokedAt) return;
    this._revokedAt = now;
    this.touch();
  }
}
