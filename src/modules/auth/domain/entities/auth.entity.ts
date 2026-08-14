import { BaseEntity } from '@shared/domain/base.entity';

export interface AuthProps {
  email: string;
  password?: string;
  displayName: string;
}

export class Auth extends BaseEntity {
  private _email: string;
  private _password?: string;
  private _displayName: string;

  constructor(props: AuthProps, id?: string) {
    super(id);
    this._email = props.email;
    this._password = props.password;
    this._displayName = props.displayName;
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

  greet(): string {
    return `Hello ${this._displayName}! Welcome to DDD Clean Architecture.`;
  }
}
