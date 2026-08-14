/**
 * Access and refresh tokens are signed with the same secret, so the `type` claim
 * is the only thing stopping one from being replayed as the other. Never widen
 * it to an optional field.
 */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  displayName: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  family_id: string;
  type: 'refresh';
}
