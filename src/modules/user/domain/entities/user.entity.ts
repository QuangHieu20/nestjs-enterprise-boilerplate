import { BaseEntity } from '@shared/domain/base.entity';

export type AuthProvider = 'local' | 'google';

export interface UserProps {
  email: string;
  password?: string;
  displayName?: string;
  isActive?: boolean;
  googleId?: string;
  provider?: AuthProvider;
}

export class User extends BaseEntity {
  private _email: string;
  private _password?: string;
  private _displayName: string;
  private _isActive: boolean;
  private _googleId?: string;
  private _provider: AuthProvider;

  constructor(props: UserProps, id?: string) {
    super(id);
    this._email = props.email;
    this._password = props.password;
    this._displayName = props.displayName ?? '';
    this._isActive = props.isActive ?? true;
    this._googleId = props.googleId;
    this._provider = props.provider ?? 'local';
  }

  static createFromGoogle(props: {
    email: string;
    displayName?: string;
    googleId: string;
  }): User {
    return new User({
      email: props.email,
      displayName: props.displayName,
      googleId: props.googleId,
      provider: 'google',
      isActive: true,
    });
  }

  get email(): string {
    return this._email;
  }

  get password(): string | undefined {
    return this._password;
  }

  get displayName(): string {
    return this._displayName;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get googleId(): string | undefined {
    return this._googleId;
  }

  get provider(): AuthProvider {
    return this._provider;
  }

  linkGoogle(googleId: string): void {
    this._googleId = googleId;
    this.touch();
  }

  updatePassword(hashedPassword: string): void {
    this._password = hashedPassword;
    this.touch();
  }

  updateProfile(displayName: string): void {
    this._displayName = displayName;
    this.touch();
  }

  activate(): void {
    this._isActive = true;
    this.touch();
  }

  deactivate(): void {
    this._isActive = false;
    this.touch();
  }
}
