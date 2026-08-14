---
to: src/modules/<%= name %>/<%= name %>.module.ts
---
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { <%= h.inflection.camelize(name) %>OrmEntity } from './infrastructure/persistence/entities/<%= name %>.orm-entity';
import { <%= h.inflection.camelize(name) %>TypeOrmRepository } from './infrastructure/persistence/repositories/<%= name %>.typeorm-repository';
import { <%= name.toUpperCase() %>_REPOSITORY } from './application/ports/<%= name %>-repository.interface';
import { Get<%= h.inflection.camelize(name) %>UseCase } from './application/use-cases/get-<%= name %>/get-<%= name %>.use-case';
import { <%= h.inflection.camelize(name) %>Controller } from './presentation/controllers/<%= name %>.controller';

@Module({
  imports: [TypeOrmModule.forFeature([<%= h.inflection.camelize(name) %>OrmEntity])],
  controllers: [<%= h.inflection.camelize(name) %>Controller],
  providers: [
    {
      provide: <%= name.toUpperCase() %>_REPOSITORY,
      useClass: <%= h.inflection.camelize(name) %>TypeOrmRepository,
    },
    Get<%= h.inflection.camelize(name) %>UseCase,
  ],
  exports: [<%= name.toUpperCase() %>_REPOSITORY, Get<%= h.inflection.camelize(name) %>UseCase],
})
export class <%= h.inflection.camelize(name) %>Module {}
