# STAGE 1: Dependency Resolver
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

# Fix: Force pnpm to create a flat node_modules so files aren't missing across stages
RUN pnpm install --frozen-lockfile --shamefully-hoist

# STAGE 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
# Copy ALL node_modules to ensure symlinks work
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
# Fix: Use pnpm exec to find tsc even if it's hoisted
RUN cd apps/api && pnpm exec tsc && pnpm exec tsc-alias

# STAGE 3: Development 

FROM node:20-alpine AS development
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
# We don't switch to a non-root user here to avoid Windows permission sync issues
EXPOSE 5000
# The command is handled by docker-compose, so we leave this empty or use a fallback
CMD ["pnpm", "run", "dev"]

# STAGE 4: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressapp

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
# Copy root node_modules for the production run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma.config.ts ./

# Added this line to give the user permission to the folder
USER root
RUN chown -R expressapp:nodejs /app

USER expressapp
EXPOSE 5000
# We create the .env in the root /app and then run migrate pointing specifically to the config

CMD ["sh", "-c", "echo \"DATABASE_URL=${DATABASE_URL}\" > .env && npx prisma migrate deploy --schema ./prisma/schema.prisma && node dist/index.js"]