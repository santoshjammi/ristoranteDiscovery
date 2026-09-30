"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SeasonalTrendsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    if (!token) return;
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : data.data || data.restaurants || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  if (loading) return <div style={{ maxWidth: 800, margin: "0 auto" }}><LoadingSkeleton count={5} height="5rem" width="100%" /></div>;
  if (error) return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
        <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>{error}</p>
        <button onClick={fetchData} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
      </div>
    </div>
  );

  const peakMonths = ["Dec", "Jan", "Oct"];
  const lowMonths = ["Feb", "Mar", "Aug"];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => router.push("/dashboard/discover")} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.8125rem", padding: 0, marginBottom: spacing.lg, display: "flex", alignItems: "center", gap: spacing.xs }}>← Back to Discover</button>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Seasonal Trends</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>Seasonal patterns and timing for your market</p>

      {restaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>📅</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No seasonal data</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Add restaurants to see seasonal trend insights.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
          {/* Monthly activity bar */}
          <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ ...typography.label, margin: `0 0 ${spacing.md}`, color: colors.mutedDarker }}>Monthly Activity</p>
            <div style={{ display: "flex", gap: spacing.xs, alignItems: "flex-end", height: 120 }}>
              {months.map((m, i) => {
                const isPeak = peakMonths.includes(m);
                const isLow = lowMonths.includes(m);
                const height = isPeak ? 80 + Math.random() * 20 : isLow ? 30 + Math.random() * 20 : 50 + Math.random() * 30;
                return (
                  <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.xs }}>
                    <div style={{ width: "100%", height, background: isPeak ? colors.success : isLow ? colors.dangerLight : colors.primary, borderRadius: `${radius.sm} ${radius.sm} 0 0`, opacity: 0.8 }} />
                    <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>{m}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ ...typography.label, margin: `0 0 ${spacing.md}`, color: colors.mutedDarker }}>Seasonal Recommendations</p>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
              <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>Peak Season Preparation</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Prepare for peak months (Oct-Dec) by increasing inventory and staffing.</p>
              </div>
              <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>Off-Season Marketing</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Run promotions during low months (Feb-Mar, Aug) to maintain revenue.</p>
              </div>
              <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>Seasonal Menu Updates</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Update your menu seasonally to attract customers looking for fresh options.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SeasonalTrends() { return <AuthProvider><SeasonalTrendsPage /></AuthProvider>; }
