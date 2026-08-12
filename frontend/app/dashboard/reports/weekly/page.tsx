"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

function WeeklyReportPage() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchRestaurants = async () => {
    if (!token) return;
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
      setRestaurants(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (id: string) => {
    setSummaryLoading(true);
    setSelectedId(id);
    try {
      const res = await fetch(`${API}/api/restaurants/${id}/summary`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setSummary(d.data); }
    } catch {} finally { setSummaryLoading(false); }
  };

  useEffect(() => { fetchRestaurants(); }, [token]);

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><LoadingSkeleton count={4} height="4rem" width="100%" /></div>;

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load</p>
          <button onClick={fetchRestaurants} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Weekly Report</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>Select a restaurant to view its weekly summary</p>

      {restaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>📄</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No restaurants yet</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Add a restaurant and run an analysis to generate weekly reports.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {restaurants.map((r) => (
            <div key={r.id}>
              <button onClick={() => fetchSummary(r.id)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, background: selectedId === r.id ? colors.primaryLight : colors.surface, borderRadius: radius.lg, border: selectedId === r.id ? `1px solid ${colors.primary}40` : `1px solid ${colors.border}`, cursor: "pointer", textAlign: "left", color: "inherit", fontSize: "inherit", fontFamily: "inherit" }}>
                <div>
                  <p style={{ ...typography.body, margin: 0, fontWeight: 500 }}>{r.name}</p>
                  <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{r.city} · Score: {r.discoverabilityScore || "—"}</p>
                </div>
                <span style={{ color: colors.muted, fontSize: "0.875rem" }}>→</span>
              </button>

              {selectedId === r.id && (
                <div style={{ marginTop: spacing.md, padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
                  {summaryLoading ? (
                    <LoadingSkeleton count={3} height="2rem" width="100%" />
                  ) : summary ? (
                    <div>
                      <p style={{ ...typography.caption, margin: `0 0 ${spacing.md}` }}>
                        {new Date(summary.period.start).toLocaleDateString()} — {new Date(summary.period.end).toLocaleDateString()}
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: spacing.md, marginBottom: spacing.lg }}>
                        <MiniStat label="Decisions" value={summary.stats.totalDecisions} color={colors.text} />
                        <MiniStat label="New" value={summary.newDecisions} color={colors.primary} />
                        <MiniStat label="Completed" value={summary.improvements} color={colors.success} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: spacing.md, marginBottom: spacing.lg }}>
                        <MiniStat label="Pending" value={summary.stats.pending} color={colors.warning} />
                        <MiniStat label="Accepted" value={summary.stats.accepted} color={colors.success} />
                      </div>
                      {summary.risks.length > 0 && (
                        <div style={{ padding: spacing.md, background: colors.dangerLight, borderRadius: radius.sm, border: `1px solid ${colors.danger}30` }}>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: colors.danger }}>⚠ {summary.risks[0]}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ ...typography.small, margin: 0, color: colors.muted }}>No data yet. Run an analysis to generate a weekly report.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md, textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color }}>{value}</p>
      <p style={{ ...typography.caption, margin: 0 }}>{label}</p>
    </div>
  );
}

export default function WeeklyReport() {
  return <AuthProvider><WeeklyReportPage /></AuthProvider>;
}
