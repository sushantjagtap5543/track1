FROM node:18-alpine AS base
WORKDIR /app

# Native deps for bcrypt
RUN apk add --no-cache build-base python3

COPY package*.json ./
RUN npm ci --legacy-peer-deps --production

COPY . .
RUN npx prisma generate

# Non-root
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S -G nodejs nodejs
USER nodejs

EXPOSE 3001
ENV NODE_ENV=production
CMD ["npm", "start"]
