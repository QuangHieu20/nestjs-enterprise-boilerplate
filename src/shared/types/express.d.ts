import type { User as DomainUser } from '@modules/user/domain/entities/user.entity';
import type { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';

declare global {
  namespace Express {
    type User = DomainUser;

    interface Request {
      user?: User;

      /** Set by GoogleAuthGuard once the Google credential verifies. */
      socialUser?: GoogleVerifiedProfile;
    }
  }
}

export {};
