---
to: src/modules/<%= name %>/infrastructure/persistence/repositories/<%= name %>.typeorm-repository.ts
---
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { <%= h.inflection.camelize(name) %> } from '@modules/<%= name %>/domain/entities/<%= name %>.entity';
import { I<%= h.inflection.camelize(name) %>Repository } from '@modules/<%= name %>/application/ports/<%= name %>-repository.interface';
import { <%= h.inflection.camelize(name) %>OrmEntity } from '../entities/<%= name %>.orm-entity';
import { <%= h.inflection.camelize(name) %>Mapper } from '../mappers/<%= name %>.mapper';

@Injectable()
export class <%= h.inflection.camelize(name) %>TypeOrmRepository implements I<%= h.inflection.camelize(name) %>Repository {
  constructor(
    @InjectRepository(<%= h.inflection.camelize(name) %>OrmEntity)
    private readonly repo: Repository<<%= h.inflection.camelize(name) %>OrmEntity>,
  ) {}

  async findById(id: string): Promise<<%= h.inflection.camelize(name) %> | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? <%= h.inflection.camelize(name) %>Mapper.toDomain(entity) : null;
  }

  async findAll(): Promise<<%= h.inflection.camelize(name) %>[]> {
    const entities = await this.repo.find();
    return entities.map(e => <%= h.inflection.camelize(name) %>Mapper.toDomain(e));
  }

  async save(domain: <%= h.inflection.camelize(name) %>): Promise<<%= h.inflection.camelize(name) %>> {
    const orm = <%= h.inflection.camelize(name) %>Mapper.toOrm(domain);
    const saved = await this.repo.save(orm as <%= h.inflection.camelize(name) %>OrmEntity);
    return <%= h.inflection.camelize(name) %>Mapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.countBy({ id });
    return count > 0;
  }
}
