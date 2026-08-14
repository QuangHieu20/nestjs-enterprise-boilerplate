---
to: src/modules/<%= name %>/presentation/controllers/<%= name %>.controller.ts
---
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Get<%= h.inflection.camelize(name) %>UseCase } from '@modules/<%= name %>/application/use-cases/get-<%= name %>/get-<%= name %>.use-case';
import { <%= h.inflection.camelize(name) %>Dto } from '@modules/<%= name %>/application/dtos/<%= name %>.dto';
import { Create<%= h.inflection.camelize(name) %>Dto } from '@modules/<%= name %>/application/dtos/create-<%= name %>.dto';

@ApiTags('<%= h.inflection.camelize(name) %>')
@Controller('<%= h.inflection.dasherize(name) %>')
export class <%= h.inflection.camelize(name) %>Controller {
  constructor(
    private readonly get<%= h.inflection.camelize(name) %>UseCase: Get<%= h.inflection.camelize(name) %>UseCase,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get <%= name %> by ID' })
  @ApiResponse({ status: 200, description: 'Returns <%= name %> object' })
  async findOne(@Param('id') id: string): Promise<<%= h.inflection.camelize(name) %>Dto> {
    return this.get<%= h.inflection.camelize(name) %>UseCase.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new <%= name %>' })
  @ApiResponse({ status: 201, description: 'Returns created <%= name %>' })
  async create(@Body() dto: Create<%= h.inflection.camelize(name) %>Dto): Promise<<%= h.inflection.camelize(name) %>Dto> {
    // TODO: Implement create use case
    throw new Error('Not implemented');
  }
}
