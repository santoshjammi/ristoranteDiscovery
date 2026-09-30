"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function OpportunitiesPage() {
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

  const opportunities = [
    { title: "Improve Local SEO", impact: "High", effort: "Medium", timeline: "2-4 weeks", desc: "Optimize your Google Business Profile and local citations to improve search ranking.", score: 92 },
    { title: "Add Online Ordering", impact: "High", effort: "Low", timeline: "1-2 weeks", desc: "Set up online ordering to capture delivery and takeout customers.", score: 88 },
    { title: "Respond to Reviews", impact: "Medium", effort: "Low", timeline: "Ongoing", desc: "Respond to all reviews to improve customer trust and engagement.", score: 75 },
    { title: "Update Menu Photos", impact: "Medium", effort: "Low", timeline: "1 week", desc: "Add high-quality photos to your menu items to increase engagement.", score: 70 },
    { title: "Expand Delivery Area", impact: "High", effort: "Medium", timeline: "2-3 weeks", desc: "Expand your delivery zone to reach more customers.", score: 65 },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => router.push("/dashboard/discover")} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.8125rem", padding: 0, marginBottom: spacing.lg, display: "flex", alignItems: "center", gap: spacing.xs }}>← Back to Discover</button>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Opportunities</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>Growth opportunities ranked by impact</p>

      {restaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>💡</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No opportunities yet</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Add restaurants to discover growth opportunities.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {opportunities.map((opp, i) => (
            <div key={opp.title} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: colors.mutedDarker }}>#{i + 1}</span>
                    <h3 style={{ ...typography.h3, margin: 0 }}>{opp.title}</h3>
                  </div>
                  <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker }}>{opp.desc}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: opp.score >= 80 ? colors.success : opp.score >= 60 ? colors.warning : colors.muted }}>{opp.score}</p>
                  <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>Impact Score</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: spacing.md, flexWrap: "wrap" }}>
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: "0.6875rem", fontWeight: 600, background: opp.impact === "High" ? colors.successLight : colors.warningLight, color: opp.impact === "High" ? colors.success : colors.warning }}>{opp.impact} Impact</span>
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: "0.6875rem", fontWeight: 600, background: colors.primaryLight, color: colors.primary }}>{opp.effort} Effort</span>
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: "0.6875rem", fontWeight: 600, background: colors.bg, color: colors.muted }}>{opp.timeline}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Opportunities() { return <AuthProvider><OpportunitiesPage /></AuthProvider>; }
