# syntax=docker/dockerfile:1

# ---- Stage 1: install dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: build TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run contract:emit \
  && npm run build \
  && npm prune --omit=dev

# ---- Stage 3: minimal runtime image ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/src/prisma ./src/prisma
COPY --from=build --chown=node:node /app/migrations ./migrations
COPY --from=build --chown=node:node /app/prisma.config.ts ./

USER node
EXPOSE 3000

CMD ["sh", "-c", "npx prisma db migrate && npm run seed && node dist/index.js"]
