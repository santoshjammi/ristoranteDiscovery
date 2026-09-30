#!/usr/bin/env bash
# Durable launcher for RDI frontend (port 3003) — used by launchd.
set -e
ROOT="/Users/santosh/Desktop/projects/ristorante/ristoranteDiscovery"
cd "$ROOT/frontend"
export NEXT_PUBLIC_API_URL="http://localhost:8040/api"
export NEXT_TELEMETRY_DISABLED=1
exec npx next start --port 3003
