---
to: src/modules/<%= name %>/domain/exceptions/<%= name %>.exception.ts
---
import { DomainException } from '@shared/domain/domain.exceptions';

export class <%= h.inflection.camelize(name) %>NotFoundException extends DomainException {
  constructor(message: string = '<%= h.inflection.camelize(name) %> not found') {
    super(message);
  }
}

export class <%= h.inflection.camelize(name) %>ConflictException extends DomainException {
  constructor(message: string = '<%= h.inflection.camelize(name) %> already exists') {
    super(message);
  }
}
