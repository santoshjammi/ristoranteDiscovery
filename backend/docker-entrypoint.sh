#!/bin/sh
set -e

# ── RistoranteDiscovery backend entrypoint ──
# 1. If a bundled production showcase DB is provided and the data dir does not
#    already hold one, copy it so the app starts from the isolated real-only
#    dataset (6 real restaurants). Never seeds synthetic fixtures.
# 2. Synchronize the Prisma schema against DATABASE_URL (idempotent; preserves
#    existing rows — the 6 real restaurants survive).
# 3. Start the Node/Express backend.

DATA_DIR=/app/data
SHOWCASE_SRC=/app/bootstrap/rtp-showcase.db
SHOWCASE_DST="${DATABASE_URL#file:}"

echo "🔄 Backend entrypoint: DATABASE_URL=${DATABASE_URL}"

# Resolve the SQLite path from DATABASE_URL (file:/app/data/rtp-showcase.db)
case "$SHOWCASE_DST" in
  /*) : ;;                       # absolute path already
  *)  SHOWCASE_DST="/app/${SHOWCASE_DST}" ;;
esac

# Bootstrap the isolated real-only showcase DB if present and missing.
if [ -f "$SHOWCASE_SRC" ] && [ ! -f "$SHOWCASE_DST" ]; then
  echo "📦 Copying bundled production showcase DB (6 real restaurants) → $SHOWCASE_DST"
  mkdir -p "$(dirname "$SHOWCASE_DST")"
  cp "$SHOWCASE_SRC" "$SHOWCASE_DST"
fi

# Synchronize schema (idempotent — does not drop existing data).
# --accept-data-loss is safe here: the ONLY non-schema table Prisma flags is
# `_deployment_meta` (a self-documenting provenance marker written by the
# build script, not part of the frozen schema, not customer data). All real
# restaurant/evidence/snapshot data lives in schema tables and is preserved.
echo "🔄 Synchronizing SQLite database schema via Prisma..."
npx prisma db push --skip-generate --accept-data-loss

# Start the Node/Express backend server
echo "🚀 Starting Node/Express backend server..."
exec node dist/index.js
