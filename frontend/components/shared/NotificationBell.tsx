"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { colors, spacing, radius } from "@/lib/design-tokens";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

export function NotificationBell({ token }: { token: string | null }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/events/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // For MSP, we show a static notification set
        setNotifications([
          {
            id: "1",
            type: "info",
            title: "Analysis Complete",
            message: "Your restaurant analysis has finished. View your recommendations.",
            read: false,
            createdAt: new Date().toISOString(),
            href: "/dashboard/intelligence/recommendations",
          },
        ]);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.25rem",
          position: "relative",
          padding: spacing.xs,
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: colors.danger,
              color: "#fff",
              fontSize: "0.625rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: 320,
            marginTop: spacing.xs,
            background: colors.surface,
            borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: `${spacing.md} ${spacing.lg}`, borderBottom: `1px solid ${colors.border}` }}>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: colors.text }}>Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: spacing.xl, textAlign: "center", color: colors.muted, fontSize: "0.8125rem" }}>
              No new notifications
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (n.href) router.push(n.href);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  gap: spacing.md,
                  padding: `${spacing.md} ${spacing.lg}`,
                  border: "none",
                  borderBottom: `1px solid ${colors.border}`,
                  background: n.read ? "transparent" : colors.primaryLight,
                  color: colors.text,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.8125rem",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{n.type === "info" ? "💡" : "🔔"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{n.title}</p>
                  <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: colors.muted }}>{n.message}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
