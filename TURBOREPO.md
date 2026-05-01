# TurboRepo Setup

## Structure

```
track/
├── apps/
│   ├── admin/          # Admin dashboard (Next.js)
│   └── api/            # Backend API (NestJS)
├── packages/
│   └── config/
│       ├── eslint/    # Shared ESLint config
│       └── typescript/ # Shared TypeScript config
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Commands

```bash
# Install dependencies
pnpm install

# Build all apps
pnpm build

# Run development
pnpm dev

# Lint all apps
pnpm lint

# Type check all apps
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## Adding New Apps

1. Create app in `apps/` directory
2. Add package.json with name `@track/<app-name>`
3. Add to workspace:

```json
// apps/<app-name>/package.json
{
  "name": "@track/client",
  ...
}
```

## Build Cache

TurboRepo caches build outputs. To force rebuild:
```bash
pnpm turbo build --force
```

## Docker Build

```bash
docker build -t track .
docker run -p 3000:3000 -p 4000:4000 track
```