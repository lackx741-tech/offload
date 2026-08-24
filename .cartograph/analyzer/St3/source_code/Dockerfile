FROM node:20-alpine AS base
WORKDIR /app

# Install ALL dependencies (including dev for build step)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --production=false --legacy-peer-deps

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN npm run build

# Production dependencies only (for runtime packages Next.js can't trace)
FROM base AS proddeps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Production
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 1. Install production node_modules first (includes ioredis, kafkajs, etc.)
COPY --from=proddeps /app/node_modules ./node_modules

# 2. Overlay Next.js standalone build (its traced node_modules merge on top)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
