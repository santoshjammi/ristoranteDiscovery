#!/usr/bin/env bash
set -e

# ──────────────────────────────────────────────
#  Ristorante Discovery — Local Dev Runner
#  Backend :8040  |  Frontend :3040
# ──────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"

# ── colours ──
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# ── 1. Backend ──
echo -e "${BLUE}━━━ Starting Backend (port 8040) ━━━${NC}"
cd "$BACKEND_DIR"
export PORT=8040
npx tsx src/index.ts &
BACKEND_PID=$!

# Wait for backend to be ready
for i in $(seq 1 15); do
  if curl -s http://localhost:8040/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend ready on http://localhost:8040${NC}"
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo -e "${YELLOW}  ⚠ Backend not responding after 15s — continuing anyway${NC}"
  fi
  sleep 1
done

# ── 2. Frontend ──
echo -e "${BLUE}━━━ Starting Frontend (port 3040) ━━━${NC}"
cd "$FRONTEND_DIR"
export NEXT_PUBLIC_API_URL="http://localhost:8040"
npx next dev --port 3040 &
FRONTEND_PID=$!

# Wait for frontend
for i in $(seq 1 20); do
  if curl -s -o /dev/null -w '' http://localhost:3040/ 2>/dev/null; then
    echo -e "${GREEN}  ✓ Frontend ready on http://localhost:3040${NC}"
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo -e "${YELLOW}  ⚠ Frontend not responding after 20s — continuing anyway${NC}"
  fi
  sleep 1
done

# ── 3. Done ──
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Ristorante Discovery is running${NC}"
echo -e "${GREEN}  Frontend → http://localhost:3040${NC}"
echo -e "${GREEN}  Backend  → http://localhost:8040${NC}"
echo -e "${GREEN}  Press Ctrl+C to stop both${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Wait for either process to exit
wait
