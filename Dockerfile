# ===========================
# Base Stage - Dependencies
# ===========================
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/

# ===========================
# Builder Stage
# ===========================
FROM base AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/

RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store \
    pnpm install

COPY . .

RUN npm install -g turbo

RUN NODE_ENV=production pnpm turbo run build

# ===========================
# API Runner (NestJS)
# ===========================
FROM node:20-alpine AS api-runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

RUN pnpm install --prod --no-optional

EXPOSE 4000

CMD ["node", "dist/main.js"]

# ===========================
# Admin Runner (Next.js)
# ===========================
FROM node:20-alpine AS admin-runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/admin/package.json apps/admin/
COPY apps/admin/next.config.mjs apps/admin/

RUN pnpm install --prod

COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

EXPOSE 3000

CMD ["node", "apps/admin/server.js"]