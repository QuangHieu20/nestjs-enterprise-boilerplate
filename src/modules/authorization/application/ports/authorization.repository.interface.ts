import { Authorization } from '../../domain/entities/authorization.entity';

export interface IAuthorizationRepository {
  findAuthorizationByUserId(userId: string): Promise<Authorization | null>;
}
