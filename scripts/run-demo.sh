#!/usr/bin/env bash
set -e

# ──────────────────────────────────────────────────────────────
#  Ristorante Discovery — Real-Data Launcher (LONG-TERM)
#
#  Always starts against the CLEAN real-data showcase DB
#  (rtp-showcase.db — 6 REAL_VERIFIED restaurants, zero synthetic).
#  NEVER the polluted dev.db. This is the correct, repeatable
#  way to run the app for a customer demo or any live use.
#
#  Backend :8040  (rtp-showcase.db)  |  Frontend :3003
# ──────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
SHOWCASE_DB="$BACKEND_DIR/prisma/rtp-showcase.db"

# Ports
BACKEND_PORT="${BACKEND_PORT:-8040}"
FRONTEND_PORT="${FRONTEND_PORT:-3003}"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

# Guard: refuse to run if the real-data DB is missing.
if [ ! -f "$SHOWCASE_DB" ]; then
  echo -e "${RED}✗ Real-data DB not found at ${SHOWCASE_DB}${NC}"
  echo -e "${YELLOW}  Build it first: node ${ROOT}/backend/scripts/build-showcase-db.mjs${NC}"
  exit 1
fi

cleanup() {
  echo ""
  echo -e "${YELLOW}⏹  Shutting down…${NC}"
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}✓ Stopped${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 1. Backend (real-data DB) ──
echo -e "${BLUE}━━━ Starting Backend (port ${BACKEND_PORT}) — rtp-showcase.db ━━━${NC}"
cd "$BACKEND_DIR"
DATABASE_URL="file:${SHOWCASE_DB}" PORT="$BACKEND_PORT" node dist/index.js &
BACKEND_PID=$!

for i in $(seq 1 20); do
  if curl -s "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend ready on http://localhost:${BACKEND_PORT}/health${NC}"
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo -e "${YELLOW}  ⚠ Backend not responding after 20s — continuing anyway${NC}"
  fi
  sleep 1
done

# ── 2. Frontend ──
echo -e "${BLUE}━━━ Starting Frontend (port ${FRONTEND_PORT}) ━━━${NC}"
cd "$FRONTEND_DIR"
NEXT_PUBLIC_API_URL="http://localhost:${BACKEND_PORT}" npx next dev --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

for i in $(seq 1 25); do
  if curl -s -o /dev/null -w '' "http://localhost:${FRONTEND_PORT}/" 2>/dev/null; then
    echo -e "${GREEN}  ✓ Frontend ready on http://localhost:${FRONTEND_PORT}${NC}"
    break
  fi
  if [ "$i" -eq 25 ]; then
    echo -e "${YELLOW}  ⚠ Frontend not responding after 25s — continuing anyway${NC}"
  fi
  sleep 1
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Ristorante Discovery running (REAL DATA)${NC}"
echo -e "${GREEN}  Frontend → http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${GREEN}  Backend  → http://localhost:${BACKEND_PORT}  (rtp-showcase.db)${NC}"
echo -e "${GREEN}  Press Ctrl+C to stop both${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

wait
