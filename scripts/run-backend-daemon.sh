#!/usr/bin/env bash
# Durable launcher for RDI backend (port 8040) — used by launchd.
set -e
ROOT="/Users/santosh/Desktop/projects/ristorante/ristoranteDiscovery"
cd "$ROOT/backend"
export DATABASE_URL="file:$ROOT/backend/prisma/rtp-showcase.db"
export PORT=8040
exec node dist/index.js
