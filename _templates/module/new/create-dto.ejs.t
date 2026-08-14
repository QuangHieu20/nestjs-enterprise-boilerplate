---
to: src/modules/<%= name %>/application/dtos/create-<%= name %>.dto.ts
---
import { IsNotEmpty, IsString } from 'class-validator';

export class Create<%= h.inflection.camelize(name) %>Dto {
  @IsNotEmpty()
  @IsString()
  name: string;

  // Add more properties as needed
}
