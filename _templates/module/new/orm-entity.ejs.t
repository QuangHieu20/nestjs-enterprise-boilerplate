---
to: src/modules/<%= name %>/infrastructure/persistence/entities/<%= name %>.orm-entity.ts
---
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('<%= h.inflection.pluralize(name) %>')
export class <%= h.inflection.camelize(name) %>OrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
