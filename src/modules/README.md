# Modules

Each feature module follows **Clean Architecture + Domain-Driven Design (DDD)** with strict layer separation and
dependency inward flow.

## 4-Layer Architecture

```
modules/
└── {feature}/
    ├── domain/                            ← PURE BUSINESS LOGIC (no framework imports)
    │   ├── entities/
    │   │   └── {entity}.entity.ts         ← Domain entities with business rules
    │   ├── exceptions/
    │   │   └── {feature}.exception.ts     ← Domain-specific exceptions
    │   └── value-objects/                 ← (Optional) Immutable value objects
    │
    ├── application/                       ← USE CASES & CONTRACTS
    │   ├── use-cases/
    │   │   └── {action}-{entity}/
    │   │       └── {action}-{entity}.use-case.ts   ← One class per use case, returns DTO
    │   ├── dtos/
    │   │   ├── {entity}.dto.ts            ← Response DTO
    │   │   └── {action}-{entity}.dto.ts   ← Request DTO with @IsEmail(), @IsNotEmpty(), etc.
    │   └── ports/                         ← INTERFACES (contracts with infrastructure)
    │       ├── {entity}-repository.interface.ts
    │       └── {service}.interface.ts     ← External service ports
    │
    ├── infrastructure/                    ← IMPLEMENTATIONS & ADAPTERS
    │   ├── persistence/
    │   │   ├── entities/
    │   │   │   └── {entity}.orm-entity.ts         ← TypeORM ORM entities
    │   │   ├── repositories/
    │   │   │   └── {entity}.typeorm-repository.ts ← Repository implementations
    │   │   └── mappers/
    │   │       └── {entity}.mapper.ts             ← ORM ↔ Domain ↔ DTO transformations
    │   └── adapters/
    │       └── {service}.adapter.ts       ← External service implementations
    │
    ├── presentation/                      ← HTTP API & ROUTING
    │   ├── controllers/
    │   │   └── {feature}.controller.ts    ← HTTP endpoints, returns DTO, uses @UseGuards()
    │   ├── guards/
    │   │   └── (optional) Feature-specific guards
    │   └── decorators/
    │       └── (optional) Custom param decorators
    │
    ├── {feature}.module.ts                ← NestJS module wiring (DI setup)
    └── index.ts                           ← (Optional) Public exports: entities, DTOs, DI tokens
