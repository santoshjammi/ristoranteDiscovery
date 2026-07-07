#!/bin/sh
set -e

# Run database synchronization (creates db file and tables if missing)
echo "🔄 Synchronizing SQLite database schema via Prisma..."
npx prisma db push --skip-generate

# Start the Node/Express backend server
echo "🚀 Starting Node/Express backend server..."
exec node dist/index.js
