# Architecture

**Analysis Date:** 2026-04-19

## Pattern Overview

**Overall:** NestJS Module Pattern (Standard NestJS MVC)

**Key Characteristics:**
- Controller-Service layer separation
- Dependency injection via decorators
- Module-based modular organization
- Async bootstrap with Express adapter

## Layers

**Controllers (HTTP Layer):**
- Purpose: Handle incoming HTTP requests and route to services
- Location: `src/app.controller.ts`
- Contains: Route decorators (@Get, @Post, etc.), request handling
- Depends on: AppService for business logic
- Used by: AppModule for registration

**Services (Business Logic Layer):**
- Purpose: Contain application business logic
- Location: `src/app.service.ts`
- Contains: Core functionality methods
- Depends on: NestJS core for @Injectable decorator
- Used by: AppController via constructor injection

**Modules (Orchestration Layer):**
- Purpose: Wire together controllers and providers
- Location: `src/app.module.ts`
- Contains: @Module decorator with imports, controllers, providers
- Depends on: NestJS common
- Used by: main.ts for application bootstrap

## Data Flow

**HTTP Request Flow:**

1. Client sends HTTP request to `http://host:port/`
2. Express adapter receives request
3. NestFactory passes to AppModule
4. AppModule routes to AppController
5. AppController calls AppService method
6. AppService returns response data
7. Response flows back through layers to client

**Bootstrap Flow:**

1. `main.ts` calls `bootstrap()`
2. `NestFactory.create(AppModule)` instantiates all components
3. `app.listen()` starts Express HTTP server
4. Server binds to port from `process.env.PORT` or default 3000

## Key Abstractions

**Injectable:**
- Purpose: Mark classes as providers for DI
- Examples: `src/app.service.ts`
- Pattern: `@Injectable()` decorator with class

**Controller:**
- Purpose: Handle HTTP endpoints
- Examples: `src/app.controller.ts`
- Pattern: `@Controller()` decorator with route methods

**Module:**
- Purpose: Group related providers and controllers
- Examples: `src/app.module.ts`
- Pattern: `@Module()` decorator with metadata

## Entry Points

**Main Application:**
- Location: `src/main.ts`
- Triggers: Node.js execution via `node dist/main` or `nest start`
- Responsibilities: Create NestJS factory, bootstrap application, bind to port

## Error Handling

**Strategy:** Default NestJS error handling (built-in Express error middleware)

**Patterns:**
- Unhandled exceptions return 500 Internal Server Error
- Route not found returns 404 Not Found
- Validation errors throw BadRequestException

## Cross-Cutting Concerns

**Logging:** Console.log patterns in service return values

**Validation:** Not implemented (no class-validator usage)

**Authentication:** Not implemented (no guards)

---

*Architecture analysis: 2026-04-19*