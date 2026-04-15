# Stage 1: Build dependencies
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache build-base python3
COPY saas/package*.json ./
# Install ALL dependencies (including devDeps for build)
RUN npm install --legacy-peer-deps

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY saas/ ./
RUN npx prisma generate
# Here you would typically run 'npm run build' if using TS or a framework

# Stage 3: Production runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY saas/package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copy built assets and generated prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app ./

# Setup non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S -G nodejs nodejs && \
    mkdir -p /app/backups && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001
CMD ["npm", "start"]
