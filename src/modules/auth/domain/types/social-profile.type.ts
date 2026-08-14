export interface GoogleVerifiedProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  picture?: string;
}
