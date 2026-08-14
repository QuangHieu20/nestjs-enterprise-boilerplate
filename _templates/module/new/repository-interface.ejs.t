---
to: src/modules/<%= name %>/application/ports/<%= name %>-repository.interface.ts
---
import { IRepository } from '@shared/domain/repository.interface';
import { <%= h.inflection.camelize(name) %> } from '@modules/<%= name %>/domain/entities/<%= name %>.entity';

export interface I<%= h.inflection.camelize(name) %>Repository extends IRepository<<%= h.inflection.camelize(name) %>> {
  // Add custom query methods here if needed
}

export const <%= name.toUpperCase() %>_REPOSITORY = Symbol('<%= name.toUpperCase() %>_REPOSITORY');
