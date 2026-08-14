/** Issues, revokes, refreshes and verifies the caller's identity (JWT today). */
export const IDENTITY_MANAGER = Symbol('IDENTITY_MANAGER');

/** Verifies a third-party credential (Google ID token) into a profile. */
export const SOCIAL_IDENTITY_VERIFIER = Symbol('SOCIAL_IDENTITY_VERIFIER');

/** Persists issued refresh tokens so rotation and reuse detection have state. */
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
