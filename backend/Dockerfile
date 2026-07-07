# Stage 1: TypeScript compiler & Prisma client generator
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001
ENV DATABASE_URL="file:/app/data/dev.db"

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built code & Prisma assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Create persistent storage folder for SQLite db
RUN mkdir -p /app/data

# Setup entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 5001

ENTRYPOINT ["./docker-entrypoint.sh"]
