FROM node:20-alpine AS base

FROM base AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

FROM base AS admin-deps
WORKDIR /app/admin
COPY admin/package*.json ./
RUN npm ci

FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./backend/
WORKDIR /app
COPY backend/ ./backend/
RUN npm run build --prefix backend

FROM base AS admin-builder
WORKDIR /app/admin
COPY admin/package*.json ./admin/
WORKDIR /app
COPY admin/ ./admin/
RUN npm run build --prefix admin

FROM base AS backend-runner
WORKDIR /app/backend
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=backend-deps --chown=nestjs:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nestjs:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=nestjs:nodejs /app/backend/package*.json ./
USER nestjs
EXPOSE 4000
CMD ["node", "dist/main"]

FROM nginx:alpine AS admin-runner
COPY --from=admin-builder --chown=nginx:nginx /app/admin/.next/standalone ./
COPY --from=admin-builder --chown=nginx:nginx /app/admin/.next/static ./.next/static
COPY --from=admin-builder --chown=nginx:nginx /app/admin/public ./public
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]