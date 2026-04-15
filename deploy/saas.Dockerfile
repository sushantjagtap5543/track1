# Stage 1: Build dependencies
FROM node:18-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    openssl \
    && rm -rf /var/lib/apt/lists/*
COPY saas/package*.json ./
# Install ALL dependencies (including devDeps for build)
RUN npm install --legacy-peer-deps

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY saas/ ./
RUN npx prisma generate

# Stage 3: Production runner
FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install only production dependencies
COPY saas/package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copy built assets and generated prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app ./

# Setup non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh -m nodejs && \
    mkdir -p /app/backups && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001
CMD ["npm", "start"]
