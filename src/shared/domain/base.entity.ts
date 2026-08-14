import { randomUUID } from 'crypto';

export abstract class BaseEntity<TId = string> {
  protected readonly _id: TId;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id?: TId) {
    this._id = id ?? (randomUUID() as unknown as TId);
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): TId {
    return this._id;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  equals(entity: BaseEntity<TId>): boolean {
    if (!(entity instanceof BaseEntity)) return false;
    return this._id === entity._id;
  }

  toString(): string {
    return `${this.constructor.name}(id=${String(this._id)})`;
  }

  toJSON() {
    return {
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
