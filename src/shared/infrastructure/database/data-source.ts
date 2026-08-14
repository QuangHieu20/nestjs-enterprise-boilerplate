import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import type { SeederOptions } from 'typeorm-extension';

dotenv.config();

// The migration/seed CLI runs outside Nest, so it reads process.env directly
// rather than through ConfigService. `seeds` comes from typeorm-extension.
export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  namingStrategy: new SnakeNamingStrategy(),
  entities: ['src/modules/**/*.orm-entity.ts'],
  migrations: ['src/shared/infrastructure/database/migrations/*.ts'],
  synchronize: false,

  seeds: ['src/shared/infrastructure/database/seeds/*.seeder.ts'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
