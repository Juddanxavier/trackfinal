# ===========================================
# Stage 1: Base image with pnpm
# ===========================================
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9 --activate

# ===========================================
# Stage 2: Install dependencies
# ===========================================
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY packages/utils/package.json packages/utils/
COPY packages/config/eslint/package.json packages/config/eslint/
COPY packages/config/typescript/package.json packages/config/typescript/

RUN pnpm install --prod

# ===========================================
# Stage 3: Build API
# ===========================================
FROM deps AS api-builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/
COPY turbo.json ./

RUN pnpm --filter @track/api build

# ===========================================
# Stage 4: Build Admin
# ===========================================
FROM deps AS admin-builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/admin/ ./apps/admin/
COPY packages/ ./packages/
COPY turbo.json ./

RUN pnpm --filter @track/admin build

# ===========================================
# Stage 5: API Runner
# ===========================================
FROM base AS api-runner
WORKDIR /app/api

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=api-builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=api-builder --chown=nestjs:nodejs /app/apps/api/package.json ./

USER nestjs
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api || exit 1

CMD ["node", "dist/main"]

# ===========================================
# Stage 6: Admin Runner (Nginx)
# ===========================================
FROM nginx:alpine AS admin-runner

COPY --from=admin-builder /app/apps/admin/.next/standalone ./
COPY --from=admin-builder /app/apps/admin/.next/static ./.next/static
COPY --from=admin-builder /app/apps/admin/public ./public
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]