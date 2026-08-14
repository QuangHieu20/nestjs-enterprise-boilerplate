import type { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';

export interface ISocialIdentityVerifier {
  verify(credential: string): Promise<GoogleVerifiedProfile>;
}
