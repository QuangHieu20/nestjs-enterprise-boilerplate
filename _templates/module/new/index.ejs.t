---
to: src/modules/<%= name %>/index.ts
---
// Domain
export { <%= h.inflection.camelize(name) %> } from './domain/entities/<%= name %>.entity';
export { I<%= h.inflection.camelize(name) %>Repository, <%= name.toUpperCase() %>_REPOSITORY } from './application/ports/<%= name %>-repository.interface';
export { <%= h.inflection.camelize(name) %>NotFoundException, <%= h.inflection.camelize(name) %>ConflictException } from './domain/exceptions/<%= name %>.exception';

// Application
export { <%= h.inflection.camelize(name) %>Dto } from './application/dtos/<%= name %>.dto';
export { Create<%= h.inflection.camelize(name) %>Dto } from './application/dtos/create-<%= name %>.dto';
export { Get<%= h.inflection.camelize(name) %>UseCase } from './application/use-cases/get-<%= name %>/get-<%= name %>.use-case';

// Module
export { <%= h.inflection.camelize(name) %>Module } from './<%= name %>.module';
