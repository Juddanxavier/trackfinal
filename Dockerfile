# ===========================================
# Stage 1: Base dependencies
# ===========================================
FROM node:20-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@9 --activate

# ===========================================
# Stage 2: API dependencies
# ===========================================
FROM base AS api-deps
WORKDIR /app
COPY apps/api/package.json apps/api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ===========================================
# Stage 3: Admin dependencies
# ===========================================
FROM base AS admin-deps
WORKDIR /app
COPY apps/admin/package.json apps/admin/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ===========================================
# Stage 4: Install all dependencies (for build)
# ===========================================
FROM base AS workspace
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
RUN pnpm install --frozen-lockfile

# ===========================================
# Stage 5: Build API
# ===========================================
FROM workspace AS api-builder
WORKDIR /app
COPY --from=workspace /app/node_modules ./node_modules
COPY apps/api/ ./apps/api/
RUN pnpm --filter @track/api build

# ===========================================
# Stage 6: Build Admin
# ===========================================
FROM workspace AS admin-builder
WORKDIR /app
COPY --from=workspace /app/node_modules ./node_modules
COPY apps/admin/ ./apps/admin/
RUN pnpm --filter @track/admin build

# ===========================================
# Stage 7: API Runner
# ===========================================
FROM base AS api-runner
WORKDIR /app/api
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=api-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=api-builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=api-builder --chown=nestjs:nodejs /app/apps/api/package.json ./

USER nestjs
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api || exit 1
CMD ["node", "dist/main"]

# ===========================================
# Stage 8: Admin Runner (Nginx)
# ===========================================
FROM nginx:alpine AS admin-runner
COPY --from=admin-builder /app/apps/admin/.next/standalone ./
COPY --from=admin-builder /app/apps/admin/.next/static ./.next/static
COPY --from=admin-builder /app/apps/admin/public ./public
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["nginx", "-g", "daemon off;"]