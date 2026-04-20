# Codebase Structure

**Analysis Date:** 2026-04-19

## Directory Layout

```
C:\websites\track\backend/
├── src/                    # Source code (TypeScript)
│   ├── main.ts           # Application entry point
│   ├── app.module.ts    # Root module definition
│   ├── app.controller.ts  # HTTP controller
│   ├── app.service.ts  # Business logic service
│   └── app.controller.spec.ts  # Unit test
├── dist/                 # Compiled JavaScript output
├── test/                 # E2E test configuration
│   └── jest-e2e.json   # Jest E2E config
├── node_modules/         # npm dependencies
├── package.json         # Project manifest
├── package-lock.json    # Dependency lockfile
├── tsconfig.json        # TypeScript configuration
├── tsconfig.build.json  # Build-only TypeScript config
├── nest-cli.json        # NestJS CLI configuration
├── eslint.config.mjs   # ESLint configuration
└── .prettierrc         # Prettier configuration
```

## Directory Purposes

**src/ (Source):**
- Purpose: All TypeScript source code
- Contains: Application modules, controllers, services, tests
- Key files: `main.ts`, `app.module.ts`, `app.controller.ts`, `app.service.ts`

**dist/ (Compiled Output):**
- Purpose: Transpiled JavaScript for production
- Contains: Compiled .js, .d.ts, .js.map files
- Generated: Yes (by `nest build` or `tsc`)
- Committed: Usually via .gitignore (not shown)

**test/ (E2E Tests):**
- Purpose: End-to-end test configuration
- Contains: jest-e2e.json
- Generated: No

## Key File Locations

**Entry Points:**
- `src/main.ts`: Application bootstrap and HTTP server startup

**Configuration:**
- `package.json`: Project metadata, scripts, dependencies
- `tsconfig.json`: TypeScript compiler options
- `nest-cli.json`: NestJS CLI build options
- `eslint.config.mjs`: ESLint rules
- `.prettierrc`: Code formatting rules

**Core Logic:**
- `src/app.module.ts`: Root module wiring
- `src/app.controller.ts`: HTTP endpoint handlers
- `src/app.service.ts`: Business logic

**Testing:**
- `src/app.controller.spec.ts`: Unit tests (co-located)
- `test/jest-e2e.json`: E2E test config

## Naming Conventions

**Files:**
- kebab-case: `app.controller.ts`, `app.service.ts`
- Suffix .controller for controllers
- Suffix .service for services
- Suffix .module for modules
- Suffix .spec.ts for unit tests

**Directories:**
- lowercase: `src/`, `dist/`, `test/`

**Classes:**
- PascalCase: `AppController`, `AppService`, `AppModule`

## Where to Add New Code

**New Feature:**
- Business logic: Add to `src/app.service.ts` or create new service
- HTTP endpoints: Add to `src/app.controller.ts` or create new controller
- Tests: Create `src/feature-name.spec.ts` (co-located)

**New Component/Module:**
- Module: Create `src/feature.module.ts` and import in `AppModule`
- Controller: Create `src/feature.controller.ts`
- Service: Create `src/feature.service.ts`

**Utilities:**
- Shared helpers: Create `src/common/` or `src/utils/` directory

## Special Directories

**src/ (Source Root):**
- Purpose: All application source code
- Generated: No
- Committed: Yes

**dist/ (Build Output):**
- Purpose: Compiled JavaScript for execution
- Generated: Yes (via `nest build`)
- Committed: No (typically in .gitignore)

---

*Structure analysis: 2026-04-19*