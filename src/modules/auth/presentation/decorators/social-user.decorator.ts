import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';

export const SocialUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GoogleVerifiedProfile => {
    const request = ctx.switchToHttp().getRequest<Request>();
    // Only valid behind GoogleAuthGuard, which sets this or throws.
    return request.socialUser!;
  },
);
