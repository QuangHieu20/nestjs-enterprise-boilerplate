---
to: src/modules/<%= name %>/domain/entities/<%= name %>.entity.ts
---
import { BaseEntity } from '@shared/domain/base.entity';

export interface <%= h.inflection.camelize(name) %>Props {
  // Define properties here
  name: string;
}

export class <%= h.inflection.camelize(name) %> extends BaseEntity {
  private _name: string;

  constructor(props: <%= h.inflection.camelize(name) %>Props, id?: string) {
    super(id);
    this._name = props.name;
  }

  get name(): string {
    return this._name;
  }
}
