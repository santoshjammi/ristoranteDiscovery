# Design: Notification System (P3)

## Purpose
Send alerts for key events: analysis complete, weekly report, new recommendations, team invites, audit complete.

## Backend Service
- New file: `backend/src/services/notification.service.ts`
- Supports channels: email (via nodemailer or SendGrid), Slack webhook, Discord webhook
- Configurable per organization via settings

## Notification Events
1. `analysis_complete` — when a restaurant analysis finishes
2. `weekly_report` — weekly intelligence summary
3. `new_recommendations` — when new recommendations are generated
4. `team_invite` — when someone is invited to the team
5. `audit_complete` — when a visibility audit finishes

## API Endpoints
- `GET /api/notifications` — list recent notifications for org
- `POST /api/notifications/preferences` — update notification preferences
- `POST /api/notifications/test` — send test notification

## Database Model
Add to Prisma schema:
```prisma
model Notification {
  id        String   @id @default(uuid())
  orgId     String
  type      String   // analysis_complete, weekly_report, etc.
  title     String
  message   String
  channel   String   // email, slack, discord, in_app
  status    String   @default("pending") // pending, sent, failed
  readAt    DateTime?
  createdAt DateTime @default(now())
}

model NotificationPreference {
  id        String @id @default(uuid())
  orgId     String
  channel   String // email, slack, discord
  enabled   Boolean @default(true)
  events    String // JSON array of event types
  config    String? // JSON: webhook URL, email, etc.
  @@unique([orgId, channel])
}
```

## Frontend
- Notification bell in dashboard header (already exists as placeholder)
- Notification list dropdown
- Notification preferences in Settings > Notifications (already has toggle UI)

## Files to create
- `backend/src/services/notification.service.ts`
- `backend/src/interfaces/routes/notification.routes.ts`
- Prisma schema update
