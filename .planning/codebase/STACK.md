# Technology Stack

**Analysis Date:** 2026-04-19

## Languages

**Primary:**
- TypeScript 5.7.3 - Core language for application code

**Secondary:**
- Not applicable

## Runtime

**Environment:**
- Node.js (uses Node resolution via nodenext module)

**Package Manager:**
- npm (default in NestJS projects)
- Lockfile: `backend/package-lock.json` present

## Frameworks

**Core:**
- NestJS 11.0.1 - Server-side framework for building scalable Node.js applications
  - `@nestjs/common` 11.0.1
  - `@nestjs/core` 11.0.1
  - `@nestjs/platform-express` 11.0.1

**Testing:**
- Jest 30.0.0 - Unit and e2e testing
- `@nestjs/testing` 11.0.1 - NestJS-specific testing utilities
- ts-jest 29.2.5 - TypeScript Jest transformer

**Build/Dev:**
- @nestjs/cli 11.0.0 - NestJS CLI for scaffolding
- ts-loader 9.5.2 - TypeScript loader for webpack
- ts-node 10.9.2 - TypeScript execution engine
- typescript 5.7.3 - TypeScript compiler

## Key Dependencies

**Critical:**
- `rxjs` 7.8.1 - Reactive programming library (required by NestJS)
- `reflect-metadata` 0.2.2 - Decorator reflection support

**Infrastructure:**
- Not detected in current package.json

## Configuration

**Environment:**
- Node.js: `process.env.PORT ?? 3000` - Port configured in `backend/src/main.ts`
- No .env file detected (uses process.env directly)

**Build:**
- `backend/tsconfig.json` - TypeScript configuration
- `backend/tsconfig.build.json` - Build-specific TypeScript configuration
- `backend/nest-cli.json` - NestJS CLI configuration
- `backend/eslint.config.mjs` - ESLint configuration

## TypeScript Configuration

**Compiler Options:**
```json
{
  "target": "ES2023",
  "module": "nodenext",
  "moduleResolution": "nodenext",
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true,
  "strictNullChecks": true,
  "outDir": "./dist"
}
```

## Platform Requirements

**Development:**
- Node.js compatible with nodenext module resolution
- npm for package management

**Production:**
- Compiled JavaScript output in `backend/dist/` folder
- Runs via `node dist/main` from backend directory

---

*Stack analysis: 2026-04-19*