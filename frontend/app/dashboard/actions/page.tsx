"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { colors, spacing, radius, typography, severityColor, severityLabel } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

interface Decision {
  id: string;
  title: string;
  description: string;
  priority: string;
  confidence: number;
  businessImpact: string;
  category: string;
  status: string;
  createdAt: string;
  restaurantId: string;
  restaurantName: string;
}

function DecisionCenterPage() {
  const { token, loading: authLoading } = useAuth();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [actioning, setActioning] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "accepted", label: "Accepted" },
    { id: "dismissed", label: "Dismissed" },
    { id: "completed", label: "Completed" },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const rRes = await fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (!rRes.ok) throw new Error("Failed to load");
        const rData = await rRes.json();
        const list = Array.isArray(rData) ? rData : rData.data || rData.restaurants || [];
        const restaurantMap = new Map(list.map((r: any) => [r.id, r.name]));
        const restaurantIds = list.map((r: any) => r.id).join(",");
        let all: Decision[] = [];
        if (restaurantIds) {
          const tab = activeTabRef.current;
          const dRes = await fetch(`${API}/api/decisions/batch?restaurantIds=${encodeURIComponent(restaurantIds)}&status=${tab === "all" ? "" : tab}`, {
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
  }, [token, retryCount, authLoading]);

  const handleAction = async (id: string, action: string) => {
    if (!token) return;
    setActioning(id);
    try {
      await fetch(`${API}/api/decisions/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      setRetryCount(n => n + 1);
    } catch {} finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Decision Center</h1>
        <LoadingSkeleton count={1} height="1.5rem" width="30%" />
        <div style={{ marginTop: spacing.xl }}><LoadingSkeleton count={5} height="4rem" width="100%" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Decision Center</h1>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load decisions</p>
          <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}` }}>{error}</p>
          <button onClick={() => setRetryCount(n => n + 1)} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      </div>
    );
  }

  const filtered = activeTab === "all" ? decisions : decisions.filter((d) => d.status === activeTab);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Decision Center</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>{decisions.length} total · {decisions.filter((d) => d.status === "pending").length} pending</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: spacing.xs, marginBottom: spacing.xl, borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.sm, overflowX: "auto" }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: `${radius.md} ${radius.md} 0 0`, border: "none", background: activeTab === tab.id ? colors.surface : "transparent", color: activeTab === tab.id ? colors.text : colors.muted, cursor: "pointer", fontSize: "0.875rem", fontWeight: activeTab === tab.id ? 600 : 400, whiteSpace: "nowrap" }}>
            {tab.label}
            {tab.id !== "all" && <span style={{ marginLeft: spacing.xs, fontSize: "0.75rem", color: colors.muted }}>({decisions.filter((d) => d.status === tab.id).length})</span>}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>✅</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No {activeTab === "all" ? "" : activeTab} decisions</h3>
          <p style={{ ...typography.small, margin: 0 }}>Run an analysis to get recommendations.</p>
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        {filtered.map((d) => (
          <div key={d.id} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
              <div style={{ flex: 1 }}>
                <Link href={`/dashboard/intelligence/recommendations/${d.id}`} style={{ textDecoration: "none" }}>
                  <h3 style={{ ...typography.h3, margin: 0, color: colors.primary }}>{d.title}</h3>
                </Link>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{d.restaurantName} · {d.category}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${severityColor(d.priority)}20`, color: severityColor(d.priority) }}>
                  {severityLabel(d.priority)}
                </span>
                <StatusBadge status={d.status} />
              </div>
            </div>
            <p style={{ ...typography.body, margin: `0 0 ${spacing.md}`, color: colors.muted, lineHeight: 1.5 }}>{d.description}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ ...typography.caption, margin: 0 }}>Impact: {d.businessImpact} · Confidence: {d.confidence}%</p>
              <div style={{ display: "flex", gap: spacing.sm }}>
                {d.status === "pending" && (
                  <>
                    <button onClick={() => handleAction(d.id, "accept")} disabled={actioning === d.id} style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, border: "none", background: colors.success, color: "#fff", cursor: actioning === d.id ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
                      Accept
                    </button>
                    <button onClick={() => handleAction(d.id, "dismiss")} disabled={actioning === d.id} style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.muted, cursor: actioning === d.id ? "not-allowed" : "pointer", fontSize: "0.75rem" }}>
                      Dismiss
                    </button>
                  </>
                )}
                {d.status === "accepted" && (
                  <button onClick={() => handleAction(d.id, "complete")} disabled={actioning === d.id} style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, border: "none", background: colors.primary, color: "#fff", cursor: actioning === d.id ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: colors.muted },
    accepted: { label: "Accepted", color: colors.success },
    dismissed: { label: "Dismissed", color: colors.mutedDarker },
    completed: { label: "Completed", color: colors.primary },
  };
  const s = map[status] || { label: status, color: colors.muted };
  return <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${s.color}20`, color: s.color }}>{s.label}</span>;
}

export default function DecisionCenter() {
  return <AuthProvider><DecisionCenterPage /></AuthProvider>;
}
