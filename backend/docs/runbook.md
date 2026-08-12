# RDI Backend — Operational Runbook

> **Production operations guide for the Restaurant Discovery Intelligence platform**

---

## Service Overview

| Property | Value |
|----------|-------|
| Service | RDI Backend |
| Port | 5001 (configurable via `PORT`) |
| Health | `GET /health/live`, `GET /health/ready`, `GET /health` |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Node | 20+ |

## Health Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health/live` | Liveness probe | `{"status":"alive"}` |
| `GET /health/ready` | Readiness probe | `{"status":"ready","checks":{"database":"healthy"}}` |
| `GET /health` | Detailed health | `{"status":"healthy","checks":{...}}` |

## Logs

All logs are structured JSON. View with:

```bash
# Tail production logs
journalctl -u rdi-backend -f

# Filter by level
journalctl -u rdi-backend | grep '"level":"error"'

# Filter by request ID
journalctl -u rdi-backend | grep '"requestId":"req-..."'
```

## Common Operations

### Restart service
```bash
systemctl restart rdi-backend
```

### Check status
```bash
systemctl status rdi-backend
```

### View recent errors
```bash
journalctl -u rdi-backend --since "5 minutes ago" | grep '"level":"error"'
```

### Run database migration
```bash
cd /opt/rdi/backend
npx prisma migrate deploy
```

### Rollback migration
```bash
cd /opt/rdi/backend
# Create a new migration that reverses the change
npx prisma migrate dev --name rollback-<description>
npx prisma migrate deploy
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5001` | HTTP port |
| `NODE_ENV` | No | `development` | Environment |
| `APP_VERSION` | No | `1.0.0` | App version |
| `DATABASE_URL` | **Yes** | — | Database connection string |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins |
| `LOG_LEVEL` | No | `info` | Log level (debug, info, warn, error) |
| `REQUEST_TIMEOUT` | No | `30000` | Request timeout in ms |
| `RATE_LIMIT_WINDOW` | No | `60000` | Rate limit window in ms |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |

## Backup

### Database
```bash
# SQLite
cp /opt/rdi/backend/prisma/dev.db /opt/rdi/backups/rdi-$(date +%Y%m%d-%H%M%S).db

# PostgreSQL
pg_dump rdi > /opt/rdi/backups/rdi-$(date +%Y%m%d-%H%M%S).sql
```

### Restore
```bash
# SQLite
cp /opt/rdi/backups/rdi-<date>.db /opt/rdi/backend/prisma/dev.db

# PostgreSQL
psql rdi < /opt/rdi/backups/rdi-<date>.sql
```

## Incident Response

### Service down
1. Check health endpoint: `curl http://localhost:5001/health`
2. Check logs: `journalctl -u rdi-backend -n 50`
3. Check database connectivity
4. Restart service: `systemctl restart rdi-backend`
5. If persists, escalate to engineering

### Database corruption
1. Stop service: `systemctl stop rdi-backend`
2. Restore from latest backup
3. Start service: `systemctl start rdi-backend`
4. Verify health: `curl http://localhost:5001/health`
5. Run data integrity check

### High error rate
1. Check logs for error patterns
2. Check database connectivity
3. Check rate limiting (too many requests?)
4. Check external service dependencies
5. Scale up if under load
