"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

const LIFECYCLE = ["pending", "accepted", "in_progress", "completed", "verified", "improved"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Detected",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  verified: "Verified",
  improved: "Improved",
  dismissed: "Dismissed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.muted,
  accepted: colors.primary,
  in_progress: colors.warning,
  completed: colors.success,
  verified: colors.success,
  improved: colors.success,
  dismissed: colors.mutedDarker,
};

// Next transition for a given status (Detected → Accepted → In Progress → Completed → Verified → Improved)
const NEXT_TRANSITION: Record<string, { action: string; endpoint: string; label: string } | null> = {
  pending: { action: "accept", endpoint: "accept", label: "Accept" },
  accepted: { action: "start", endpoint: "start", label: "Start" },
  in_progress: { action: "complete", endpoint: "complete", label: "Complete" },
  completed: { action: "verify", endpoint: "verify", label: "Verify" },
  verified: { action: "improved", endpoint: "improved", label: "Mark Improved" },
  improved: null,
  dismissed: null,
};

function TasksPage() {
  const { token } = useAuth();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadDecisions = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
      const restaurantMap = new Map(list.map((r: any) => [r.id, r.name]));
      const restaurantIds = list.map((r: any) => r.id).join(",");
      let all: any[] = [];
      if (restaurantIds) {
        const dRes = await fetch(`${API}/api/decisions/batch?restaurantIds=${encodeURIComponent(restaurantIds)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (dRes.ok) {
          const dData = await dRes.json();
          const dList = Array.isArray(dData.data) ? dData.data : [];
          all = dList.map((d: any) => ({ ...d, restaurantName: restaurantMap.get(d.restaurantId) || "Unknown" }));
        }
      }
      setDecisions(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const transition = async (id: string, endpoint: string) => {
    if (!token) return;
    await fetch(`${API}/api/decisions/${id}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    loadDecisions();
  };

  useEffect(() => { loadDecisions(); }, [token, retryCount]);

  const filtered = statusFilter === "all" ? decisions : decisions.filter((d) => d.status === statusFilter);

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Tasks</h1><LoadingSkeleton count={5} height="4rem" width="100%" /></div>;

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Tasks</h1>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load decisions</p>
          <button onClick={() => setRetryCount(n => n + 1)} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Tasks</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}` }}>{decisions.length} decisions · Detected → Accepted → In Progress → Completed → Verified → Improved</p>

      {/* Lifecycle filter */}
      <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap" }}>
        {["all", ...LIFECYCLE, "dismissed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: radius.sm,
              border: `1px solid ${statusFilter === s ? colors.primary : colors.border}`,
              background: statusFilter === s ? colors.primaryLight : "transparent",
              color: statusFilter === s ? colors.primary : colors.muted,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.75rem",
              textTransform: "capitalize",
            }}
          >
            {s === "all" ? "All" : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>📋</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No decisions here</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Accept a recommendation to start its lifecycle.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {filtered.map((d) => {
            const next = NEXT_TRANSITION[d.status];
            const color = STATUS_COLORS[d.status] || colors.muted;
            return (
              <div key={d.id} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
                  <div>
                    <h3 style={{ ...typography.h3, margin: 0 }}>{d.title}</h3>
                    <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{d.restaurantName} · {d.category}</p>
                  </div>
                  <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${color}20`, color }}>{STATUS_LABELS[d.status] || d.status}</span>
                </div>

                {/* Lifecycle progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: spacing.xs, marginBottom: spacing.md }}>
                  {LIFECYCLE.map((stage, i) => {
                    const stageIdx = LIFECYCLE.indexOf(d.status as any);
                    const reached = i <= stageIdx;
                    return (
                      <div key={stage} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: "100%", height: 3, background: reached ? colors.primary : colors.border, borderRadius: 2 }} />
                        <span style={{ fontSize: "0.5625rem", color: reached ? colors.primary : colors.mutedDarker, marginTop: spacing.xs }}>{STATUS_LABELS[stage]}</span>
                      </div>
                    );
                  })}
                </div>

                {d.description && <p style={{ ...typography.body, margin: `0 0 ${spacing.md}`, color: colors.muted }}>{d.description}</p>}
                <div style={{ display: "flex", gap: spacing.md, alignItems: "center", ...typography.caption, flexWrap: "wrap" }}>
                  <span>Impact: {d.businessImpact}</span>
                  <span>Effort: {d.effort}</span>
                  {next && (
                    <button
                      onClick={() => transition(d.id, next.endpoint)}
                      style={{ marginLeft: "auto", padding: `${spacing.xs} ${spacing.lg}`, borderRadius: radius.sm, border: "none", background: colors.primary, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }}
                    >
                      {next.label} →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  return <AuthProvider><TasksPage /></AuthProvider>;
}
