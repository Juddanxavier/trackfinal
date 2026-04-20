# Testing Patterns

**Analysis Date:** 2026-04-19

## Test Framework

**Runner:**
- Jest v30.0.0
- Config: Inline in `package.json`
- Test suffix: `.spec.ts`

**Assertion Library:**
- Jest built-in expect

**Run Commands:**
```bash
npm test                   # Run all tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage
npm run test:debug      # Debug mode
npm run test:e2e        # E2E tests
```

## Test File Organization

**Location:**
- Co-located with source files
- Same directory as implementation

**Naming:**
- `{filename}.spec.ts`

**Structure:**
- `backend/src/app.controller.spec.ts` tests `backend/src/app.controller.ts`

## Test Structure

**Suite Organization:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
```

**Patterns:**
- `describe()` blocks for test suites
- `beforeEach()` for setup/teardown
- `it()` or `test()` for individual tests

## Mocking

**Framework:** NestJS Testing Module

**Patterns:**
```typescript
// Mock providers
const mockAppService = {
  getHello: () => 'Hello World!',
};

// Use in testing module
providers: [
  {
    provide: AppService,
    useValue: mockAppService,
  },
]
```

**What to Mock:**
- External services (database, APIs)
- Time-dependent logic
- File system operations

**What NOT to Mock:**
- Core business logic being tested
- Simple service methods

## Fixtures and Factories

**Test Data:**
```typescript
// Create test data utilities
const createTestUser = (overrides?: Partial<User>) => ({
  id: 'test-id',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});
```

**Location:**
- Define in test file or separate fixtures file

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
npm run test:cov
```

**Output:**
- Directory: `backend/coverage/`
- Format: JSON, HTML, Text

## Test Types

**Unit Tests:**
- Scope: Individual services, controllers
- Approach: Test with mocked dependencies
- Location: `src/**/*.spec.ts`

**Integration Tests:**
- Scope: Module-level testing
- Approach: Test with real module setup
- Not extensively used currently

**E2E Tests:**
- Framework: supertest
- Config: `test/jest-e2e.json`
- Not present in current codebase

## Common Patterns

**Async Testing:**
```typescript
it('should async return data', async () => {
  const result = await appController.getData();
  expect(result).toBeDefined();
});
```

**Error Testing:**
```typescript
it('should throw error for invalid input', () => {
  expect(() => service.invalidOperation()).toThrow();
});
```

**Testing Controllers:**
- Use `request` package for HTTP testing
- Use supertest for E2E

---

*Testing analysis: 2026-04-19*