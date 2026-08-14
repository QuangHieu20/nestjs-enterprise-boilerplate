import type { Response, Request } from 'express';
import type { User } from '@modules/user/domain/entities/user.entity';
import type { AuthPayload } from '@shared/interfaces/auth.interface';

export interface IIdentityManager {
  issue(user: User, response: Response): Promise<AuthPayload>;

  /** Needs the request: the refresh cookie identifies which token family to kill. */
  revoke(user: User, request: Request, response: Response): Promise<void>;

  refresh(request: Request, response: Response): Promise<AuthPayload>;

  verify(request: Request): Promise<User | null>;
}
