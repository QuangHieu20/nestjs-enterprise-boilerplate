import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'auth_db',
  // Entities come from TypeOrmModule.forFeature() registrations, so no glob.
  autoLoadEntities: true,
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  // Must mirror data-source.ts, which generates migrations in snake_case.
  namingStrategy: new SnakeNamingStrategy(),
  // Schema changes go through migrations only, in every environment.
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
}));
