---
to: src/modules/<%= name %>/application/use-cases/get-<%= name %>/get-<%= name %>.use-case.ts
---
import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/application/use-case.interface';
import { <%= h.inflection.camelize(name) %>Dto } from '@modules/<%= name %>/application/dtos/<%= name %>.dto';
import { I<%= h.inflection.camelize(name) %>Repository, <%= name.toUpperCase() %>_REPOSITORY } from '@modules/<%= name %>/application/ports/<%= name %>-repository.interface';
import { <%= h.inflection.camelize(name) %>NotFoundException } from '@modules/<%= name %>/domain/exceptions/<%= name %>.exception';
import { <%= h.inflection.camelize(name) %>Mapper } from '@modules/<%= name %>/infrastructure/persistence/mappers/<%= name %>.mapper';

@Injectable()
export class Get<%= h.inflection.camelize(name) %>UseCase implements IUseCase<string, <%= h.inflection.camelize(name) %>Dto> {
  constructor(
    @Inject(<%= name.toUpperCase() %>_REPOSITORY)
    private readonly repository: I<%= h.inflection.camelize(name) %>Repository,
  ) {}

  async execute(id: string): Promise<<%= h.inflection.camelize(name) %>Dto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new <%= h.inflection.camelize(name) %>NotFoundException(
        `<%= h.inflection.camelize(name) %> with ID ${id} not found`,
      );
    }
    return <%= h.inflection.camelize(name) %>Mapper.toDto(entity);
  }
}
