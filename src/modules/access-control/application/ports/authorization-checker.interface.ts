export interface IAuthorizationChecker {
  can(action: string, subject: string): Promise<boolean>;

  cannot(action: string, subject: string): Promise<boolean>;
}
