# ── RistoranteDiscovery — Frontend (Next.js 16, standalone) ──
# Stage 1: build the Next.js production bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build with production API URL baked in (or override at build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:5040/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production
RUN npm run build

# Stage 2: production runner using standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output (self-contained server + node_modules)
COPY --from=builder /app/.next-prod/standalone ./
COPY --from=builder /app/.next-prod/static ./.next-prod/static

# Run as a non-root user (container hardening). The standalone output is
# self-contained; make it owned by the app user so it can serve without root.
RUN addgroup -S -g 1001 appgroup && adduser -S -u 1001 -G appgroup appuser \
  && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
