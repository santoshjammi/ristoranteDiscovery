# Stage 1: TypeScript compiler & Prisma client generator
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production runner
# Debian-slim (not alpine) so Prisma's schema engine finds libssl/openssl.
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001
ENV DATABASE_URL="file:/app/data/rtp-showcase.db"

# Prisma's schema engine needs OpenSSL (recommended by Prisma's own error).
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built code & Prisma assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Create persistent storage folder for SQLite db
RUN mkdir -p /app/data /app/bootstrap

# Bundle the isolated production showcase DB (6 real restaurants) for bootstrap
COPY prisma/rtp-showcase.db /app/bootstrap/rtp-showcase.db

# Run as a non-root user (container hardening). Create a dedicated app user,
# grant ownership of /app so the SQLite DB and entrypoint remain writable.
RUN useradd --create-home --uid 1001 --shell /usr/sbin/nologin appuser \
  && chown -R appuser:appuser /app

# Setup entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER appuser

EXPOSE 5001

ENTRYPOINT ["./docker-entrypoint.sh"]
