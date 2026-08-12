"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

function TasksPage() {
  const { token } = useAuth();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
        const restaurantMap = new Map(list.map((r: any) => [r.id, r.name]));
        const restaurantIds = list.map((r: any) => r.id).join(",");
        let all: any[] = [];
        if (restaurantIds) {
          const dRes = await fetch(`${API}/api/decisions/batch?restaurantIds=${encodeURIComponent(restaurantIds)}&status=accepted`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          if (dRes.ok) {
            const dData = await dRes.json();
            const dList = Array.isArray(dData.data) ? dData.data : [];
            all = dList.map((d: any) => ({ ...d, restaurantName: restaurantMap.get(d.restaurantId) || "Unknown" }));
          }
        }
        if (!cancelled) setDecisions(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, retryCount]);

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Tasks</h1><LoadingSkeleton count={5} height="4rem" width="100%" /></div>;

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Tasks</h1>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load tasks</p>
          <button onClick={() => setRetryCount(n => n + 1)} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Tasks</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>{decisions.length} accepted recommendation{decisions.length !== 1 ? "s" : ""} in progress</p>

      {decisions.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>📋</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No active tasks</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Accept a recommendation to create a task.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {decisions.map((d) => (
            <div key={d.id} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
                <div>
                  <h3 style={{ ...typography.h3, margin: 0 }}>{d.title}</h3>
                  <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{d.restaurantName} · {d.category}</p>
                </div>
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${colors.warningLight}`, color: colors.warning }}>In Progress</span>
              </div>
              <p style={{ ...typography.body, margin: `0 0 ${spacing.md}`, color: colors.muted }}>{d.description}</p>
              <div style={{ display: "flex", gap: spacing.md, ...typography.caption }}>
                <span>Impact: {d.businessImpact}</span>
                <span>Effort: {d.effort}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  return <AuthProvider><TasksPage /></AuthProvider>;
}
