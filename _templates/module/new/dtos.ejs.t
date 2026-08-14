---
to: src/modules/<%= name %>/application/dtos/<%= name %>.dto.ts
---
export class <%= h.inflection.camelize(name) %>Dto {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
