# Template Structure Updates - Clean Architecture Alignment

## 📋 Overview

Templates updated to enforce **Clean Architecture + DDD principles**. All new modules generated via `pnpm gen:module` will follow the corrected structure.

---

## ✅ Changes Made

### 1. Repository Interface → Application Ports
**Before**: `domain/repositories/{name}.repository.interface.ts`
**After**: `application/ports/{name}-repository.interface.ts`

**Reason**: Ports are application-level concerns, not domain-level.

---

### 2. Mapper Extracted → Infrastructure
**Before**: Mapping logic embedded in repository
**After**: `infrastructure/persistence/mappers/{name}.mapper.ts`

**Features**:
- `toDomain()` - ORM entity → domain entity
- `toOrm()` - Domain entity → ORM entity
- `toDto()` - Domain entity → DTO

---

### 3. DTOs Added → Application Layer
**New Files**:
- `application/dtos/{name}.dto.ts` — Response DTO
- `application/dtos/create-{name}.dto.ts` — Create request DTO with validators

**Features**:
- `@IsNotEmpty()`, `@IsString()` validation decorators
- Clear separation of request/response models

---

### 4. Exceptions Added → Domain
**New File**: `domain/exceptions/{name}.exception.ts`

**Exports**:
- `{Name}NotFoundException` - For not found errors
- `{Name}ConflictException` - For conflict errors

**Reason**: Domain-level exceptions, thrown from use cases.

---

### 5. Use Case Updated
**Changes**:
- Return DTOs instead of domain entities
- Use domain exceptions
- Import repository from `application/ports/`
- Use mapper for transformations

---

### 6. Repository Implementation Updated
**Changes**:
- Import repository interface from `application/ports/`
- Use `{Name}Mapper` for all transformations
- No mapping logic in repository

---

### 7. Module Wiring Simplified
**Changes**:
- Import repository interface from correct location
- Cleaner provider registration

---

### 8. Controller Enhanced
**Changes**:
- Return DTOs with proper types
- Added POST endpoint stub
- Swagger decorators
- Proper typing

---

### 9. Index File Added
**New File**: `index.ts`

**Purpose**: Explicit public exports
- Domain entities & exceptions
- DTOs
- Use cases
- Module itself

**Benefit**: Clear API surface for other modules

---

## 📁 Complete Module Structure

```
src/modules/{name}/
├── domain/
│   ├── entities/
│   │   └── {name}.entity.ts
│   ├── exceptions/
│   │   └── {name}.exception.ts          ✨ NEW
│   └── ports/
│       └── (if needed for non-repo)
├── application/
│   ├── dtos/
│   │   ├── {name}.dto.ts                ✨ NEW
│   │   └── create-{name}.dto.ts         ✨ NEW
│   ├── ports/
│   │   └── {name}-repository.interface.ts   ✨ MOVED from domain/repositories/
│   └── use-cases/
│       └── get-{name}/
│           └── get-{name}.use-case.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── entities/
│   │   │   └── {name}.orm-entity.ts
│   │   ├── repositories/
│   │   │   └── {name}.typeorm-repository.ts
│   │   └── mappers/
│   │       └── {name}.mapper.ts         ✨ NEW
│   └── adapters/
│       └── (external services)
├── presentation/
│   └── controllers/
│       └── {name}.controller.ts
├── {name}.module.ts
└── index.ts                             ✨ NEW
```

---

## 🔄 How to Use Updated Templates

```bash
pnpm gen:module comment
```

This now generates:
- ✅ Domain entity (no framework imports)
- ✅ Domain exceptions
- ✅ Repository interface in `application/ports/`
- ✅ DTOs with validators
- ✅ Mapper (toDomain, toOrm, toDto)
- ✅ TypeORM repository using mapper
- ✅ Use case returning DTO
- ✅ Controller with proper types
- ✅ Module wiring
- ✅ Index file with exports

---

## 📚 Reference to Clean Architecture

| Layer | Responsibility | Imports |
|-------|---|---|
| **Domain** | Business logic, entities, exceptions | NOTHING (pure) |
| **Application** | Use cases, DTOs, ports (interfaces) | Domain only |
| **Infrastructure** | Adapters, implementations, ORM | NestJS, TypeORM, Application, Domain |
| **Presentation** | Controllers, HTTP | NestJS, Application, Domain |

---

## 🎯 Benefits

✅ **Clear separation of concerns** - Each layer has distinct responsibility
✅ **Testability** - Domain layer has zero framework dependencies
✅ **Maintainability** - Consistent structure across all modules
✅ **Reusability** - Ports/interfaces enable easy swapping
✅ **Scalability** - Easy to add new adapters, use cases, exceptions

---

## ⚠️ Migration Guide for Existing Modules

If you have existing modules using old structure, update them:

1. Move `domain/repositories/{name}.repository.interface.ts` → `application/ports/{name}-repository.interface.ts`
2. Create `application/dtos/{name}.dto.ts` and `create-{name}.dto.ts`
3. Extract `infrastructure/persistence/mappers/{name}.mapper.ts`
4. Create `domain/exceptions/{name}.exception.ts`
5. Update imports in repository implementation
6. Update imports in use cases
7. Add `index.ts` with exports
8. Update module.ts imports

**Use `/clean-arch validate` to check module structure**:
```
/clean-arch validate src/modules/your-module
```

---

## 📖 Related Documentation

- **CLAUDE.md**: Architecture overview, conventions
- **Skill `/clean-arch`**: Validate module structure
- **Memory: codebase_index.md**: File locations reference
- **Memory: key_types_interfaces.md**: Interface patterns

---

**Generated**: July 2026  
**Aligned with**: Clean Architecture + DDD + NestJS best practices
