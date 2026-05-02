FROM node:20-alpine AS base

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/notification-service/package.json ./apps/notification-service/
COPY packages/core/package.json ./packages/core/

RUN pnpm install --frozen-lockfile --shamefully-hoist

COPY . .

RUN cd packages/core && pnpm exec tsc

CMD ["npx", "tsx", "apps/notification-service/src/index.ts"]

