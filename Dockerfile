# ===========================
# Base Stage - Dependencies
# ===========================
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/

# ===========================
# Builder Stage - Install & Build
# ===========================
FROM base AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/admin/package.json apps/admin/
COPY apps/api/package.json apps/api/

RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store \
    pnpm install

COPY . .

RUN npm install -g turbo @nestjs/cli

RUN NODE_ENV=production pnpm run build

# ===========================
# API Runner - NestJS
# ===========================
FROM node:20-alpine AS api-runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

RUN npm install -g ts-node && \
    npm install --omit=dev --ignore-scripts

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/main.js"]

# ===========================
# Admin Runner - Next.js
# ===========================
FROM node:20-alpine AS admin-runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/apps/admin/node_modules ./apps/admin/node_modules

WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "apps/admin/node_modules/next/dist/bin/next", "start"]