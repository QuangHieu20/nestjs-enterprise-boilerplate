# NestJS Enterprise Boilerplate

Professional, production-ready backend boilerplate built on **NestJS 11**, **TypeScript 5.7+**, and **PostgreSQL**.

---

## 1. Architecture & Features Overview

### 1.1. Architecture
The project is designed with **Clean Architecture + Domain-Driven Design (DDD)** combined with **Ports & Adapters (Hexagonal Architecture)** following a **Modular Monolith** approach:
- **Domain Layer**: Contains pure business logic, entities, value objects, and domain exceptions, completely independent of the framework.
- **Application Layer**: Encapsulates Use Cases, DTOs, and defines Ports (interfaces).
- **Infrastructure Layer**: Implements adapters (TypeORM Repositories, Database context, Message Queue publisher/consumer, External APIs).
- **Presentation Layer**: HTTP Controllers, Guards, Interceptors, Custom Decorators.

### 1.2.  Built-in Feature

- [x] Authentication — JWT, Refresh Token Rotation, Google OAuth
- [x] Authorization — RBAC & ABAC with CASL
- [x] Database — PostgreSQL + TypeORM
- [x] Message Queue — RabbitMQ
- [x] Transactional Outbox
- [x] Security — Helmet, Cookie Parser, Rate Limiting
- [x] Internationalization (I18N)
- [x] Global Error Handling
- [x] Standardized API Response
- [x] Swagger / OpenAPI
- [x] Code Scaffolding — Hygen
- [x] Docker
- [x] CI — GitHub Actions
- [x] Unit & E2E Tests
---

## 2. Source Code Structure (Project Tree)

```text
.
├── _templates/                     # Hygen templates for automatic module scaffolding
├── docs/                           # Design documentation & project assets
├── src/
│   ├── modules/                    # Feature modules based on Bounded Context (DDD)
│   │   ├── access-control/         # CASL Policy & Ability enforcement (ABAC)
│   │   ├── auth/                   # Login, registration, JWT, Refresh Token, Google OAuth management
│   │   ├── authorization/          # Role, Permission management (RBAC)
│   │   ├── i18n/                   # Internationalization module (en/vi JSON catalogs, translation adapters)
│   │   ├── message-queue/          # RabbitMQ client, consumer retry handler, Transactional Outbox
│   │   └── user/                   # User domain, entity, password hasher & profile management
│   ├── shared/                     # Shared resources for the entire project
│   │   ├── application/            # Shared Application layer interfaces (IUseCase)
│   │   ├── domain/                 # Base entities, shared domain exceptions
│   │   ├── infrastructure/         # TypeORM configuration, database migrations, seeders, env validation
│   │   ├── presentation/           # Global exception filters, response interceptors, public decorators
│   │   └── types/                  # Global TypeScript type declarations (Express Request extensions)
│   ├── app.module.ts               # Root module connecting all modules and configuring the system
│   └── main.ts                     # Entry point for application startup, configures Swagger, Pipes, Helmet
├── test/                           # End-to-End (E2E) test suites
├── docker-compose.yml              # Docker configuration for PostgreSQL database
├── eslint.config.mjs               # ESLint 9 configuration (Flat config)
├── package.json                    # Package declarations and execution scripts
└── tsconfig.json                   # TypeScript compiler configuration and Path Aliases (@modules/*, @shared/*)
```

---

## 3. Setup & Running (Git & Docker)

### 3.1. Clone Project
```bash
git clone git@github.com:QuangHieu20/nestjs-enterprise-boilerplate.git
cd nestjs-enterprise-boilerplate
```

### 3.2. Install Dependencies & Environment Variables
```bash
pnpm install
cp .env.example .env
```

### 3.3. Start Database with Docker
```bash
# Start PostgreSQL container
docker-compose up -d

# Run migrations to initialize database tables
pnpm migration:run

# (Optional) Run initial data seeding
pnpm seed
```

### 3.4. Run Development Server
```bash
pnpm start:dev
```

Access the API at:
- **Local**: [http://localhost:3000](http://localhost:3000)
- **Swagger Documentation**: [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 4. Available Commands (Scripts)

| Command | Purpose |
| :--- | :--- |
| `pnpm start:dev` | Starts the server in development environment (watch mode with hot-reload). |
| `pnpm start:prod` | Starts the server in production environment from the `dist/` directory. |
| `pnpm build` | Compiles TypeScript source code to JavaScript (`dist/`). |
| `pnpm typecheck` | Checks TypeScript type errors for both src and tests without building. |
| `pnpm lint` | Scans and automatically fixes linting errors with ESLint. |
| `pnpm format` | Automatically formats all source code according to Prettier standards. |
| `pnpm test` | Runs all Unit Tests with Jest. |
| `pnpm test:watch` | Runs Unit Tests in watch mode for file changes. |
| `pnpm test:cov` | Runs Unit Tests and generates a code coverage report. |
| `pnpm test:e2e` | Runs End-to-End Tests. |
| `pnpm migration:generate` | Automatically generates a new migration file based on TypeORM Entity changes. |
| `pnpm migration:run` | Applies pending migrations to the database. |
| `pnpm migration:revert` | Reverts the most recent migration. |
| `pnpm seed` | Loads initial sample data into the database via `typeorm-extension`. |
| `pnpm gen:module <name>` | Automatically creates a new 4-layer Clean Architecture module scaffold using Hygen. |

---

## 5. About Us & Contact

Project built and maintained by:
- **Author**: Hieu Nguyen
- **Email**: [hieunq.work.dev@gmail.com](mailto:hieunq.work.dev@gmail.com)
- **GitHub**: [@HieuNQ](https://github.com/QuangHieu20)

---

## 6. License

Project released under the [MIT License](LICENSE).
