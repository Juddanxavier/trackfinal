# Coding Conventions

**Analysis Date:** 2026-04-19

## Naming Patterns

**Files:**
- camelCase for TypeScript files: `app.controller.ts`, `app.service.ts`
- Suffix pattern: `.controller.ts`, `.service.ts`, `.module.ts`, `.spec.ts`

**Functions:**
- camelCase: `getHello()`, `getAllUsers()`, `createUser()`

**Variables:**
- camelCase: `appController`, `userData`, `isActive`

**Types:**
- PascalCase: `AppController`, `UserService`, `CreateUserDto`

## Code Style

**Formatting:**
- Tool: Prettier v3.4.2
- singleQuote: true
- trailingComma: all
- endOfLine: auto

**Linting:**
- Tool: ESLint 9.18.0 with TypeScript ESLint 8.20.0
- Config: `eslint.config.mjs`
- Key rules enabled:
  - `@typescript-eslint/no-explicit-any`: off
  - `@typescript-eslint/no-floating-promises`: warn
  - `@typescript-eslint/no-unsafe-argument`: warn
- prettier/prettier: error

## Import Organization

**Order:**
1. External packages (`@nestjs/*`, `rxjs`)
2. Internal modules (`./`)
3. Relative imports

**Path Aliases:**
- Not configured

## Error Handling

**Patterns:**
- Use NestJS built-in exception filters
- Throw `HttpException` for HTTP errors
- Use `@Catch()` decorator for custom error handling

**Logging:**
- NestJS built-in logger
- Use `this.logger.log()` for application logs

## Comments

**When to Comment:**
- Document public API methods with JSDoc
- Explain complex business logic
- Document non-obvious workarounds

**JSDoc/TSDoc:**
- Use JSDoc for public methods: `/** description */`
- Not enforced by lint rules

## Function Design

**Size:** Keep functions under 50 lines
**Parameters:** Use DTOs for complex parameter objects
**Return Values:** Use explicit return types

## Module Design

**Exports:**
- Named exports for services, controllers
- exports in separate files pattern

**Barrel Files:**
- Not used

## Git Conventions

**Commits:**
- Conventional commit format not enforced
- Descriptive commit messages required

**Branches:**
- No enforced naming convention
- Use descriptive names: `feature/user-auth`, `fix/login-issue`

## Documentation Standards

**Code Documentation:**
- JSDoc for public APIs
- Inline comments for complex logic
- Keep comments synchronized with code

**Project Documentation:**
- README.md for project overview
- API documentation via Swagger/OpenAPI (NestJS)

## API Design Patterns

**REST Endpoints:**
- Use NestJS decorators: `@Controller()`, `@Get()`, `@Post()`, `@Put()`, `@Delete()`
- Route parameters: `@Param()`, `@Body()`, `@Query()`
- Status codes: Use HttpStatus enum

**Request/Response:**
- DTOs for request validation with class-validator
- Transform responses with interceptors

---

*Convention analysis: 2026-04-19*