"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function CompetitorActivityPage() {
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

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => router.push("/dashboard/discover")} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.8125rem", padding: 0, marginBottom: spacing.lg, display: "flex", alignItems: "center", gap: spacing.xs }}>← Back to Discover</button>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Competitor Activity</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>Competitor movements and market changes</p>

      {restaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>🏆</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No competitor data</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Add restaurants to see competitive insights.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: spacing.md, marginBottom: spacing.md }}>
            <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <p style={{ ...typography.label, margin: 0, color: colors.mutedDarker }}>Your Restaurants</p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "1.5rem", fontWeight: 700, color: colors.primary }}>{restaurants.length}</p>
            </div>
            <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <p style={{ ...typography.label, margin: 0, color: colors.mutedDarker }}>Avg Score</p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "1.5rem", fontWeight: 700, color: colors.text }}>{restaurants.length > 0 ? Math.round(restaurants.reduce((s: number, r: any) => s + (r.discoverabilityScore || 0), 0) / restaurants.length) : "—"}</p>
            </div>
            <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <p style={{ ...typography.label, margin: 0, color: colors.mutedDarker }}>Need Improvement</p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "1.5rem", fontWeight: 700, color: colors.danger }}>{restaurants.filter((r: any) => (r.discoverabilityScore || 0) < 50).length}</p>
            </div>
          </div>
          <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ ...typography.label, margin: 0, color: colors.mutedDarker }}>Recent Activity</p>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginTop: spacing.md }}>
              {restaurants.slice(0, 5).map((r: any) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: colors.text }}>{r.name}</p>
                  <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: "0.6875rem", fontWeight: 600, background: (r.discoverabilityScore || 0) >= 50 ? colors.successLight : colors.dangerLight, color: (r.discoverabilityScore || 0) >= 50 ? colors.success : colors.danger }}>
                    Score: {r.discoverabilityScore || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompetitorActivity() { return <AuthProvider><CompetitorActivityPage /></AuthProvider>; }
