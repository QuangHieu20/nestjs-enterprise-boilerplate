---
to: src/modules/<%= name %>/infrastructure/persistence/mappers/<%= name %>.mapper.ts
---
import { <%= h.inflection.camelize(name) %> } from '@modules/<%= name %>/domain/entities/<%= name %>.entity';
import { <%= h.inflection.camelize(name) %>OrmEntity } from '../entities/<%= name %>.orm-entity';
import { <%= h.inflection.camelize(name) %>Dto } from '@modules/<%= name %>/application/dtos/<%= name %>.dto';

export class <%= h.inflection.camelize(name) %>Mapper {
  static toDomain(orm: <%= h.inflection.camelize(name) %>OrmEntity): <%= h.inflection.camelize(name) %> {
    return new <%= h.inflection.camelize(name) %>(
      {
        name: orm.name,
      },
      orm.id,
    );
  }

  static toOrm(domain: <%= h.inflection.camelize(name) %>): Partial<<%= h.inflection.camelize(name) %>OrmEntity> {
    return {
      id: domain.id as string,
      name: domain.name,
    };
  }

  static toDto(domain: <%= h.inflection.camelize(name) %>): <%= h.inflection.camelize(name) %>Dto {
    return {
      id: domain.id,
      name: domain.name,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
