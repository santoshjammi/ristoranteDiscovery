"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function IntelligenceOverviewPage() {
  const { token } = useAuth();
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
      const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
      setRestaurants(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <LoadingSkeleton count={1} height="1.5rem" width="30%" />
        <div style={{ marginTop: spacing.xl, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: spacing.md }}>
          <LoadingSkeleton count={3} height="4rem" width="100%" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load intelligence</p>
          <button onClick={fetchData} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      </div>
    );
  }

  const allScores = restaurants.flatMap((r: any) => [r.discoverabilityScore, r.aiVisibilityScore, r.localSearchScore, r.menuDiscoverabilityScore, r.gbpHealthScore].filter(Boolean));
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) : 0;
  const totalIssues = restaurants.reduce((sum: number, r: any) => sum + (r.discoverabilityScore < 50 ? 1 : 0), 0);

  const categories = [
    { key: "discoverabilityScore", label: "Discoverability", icon: "🔍" },
    { key: "aiVisibilityScore", label: "AI Visibility", icon: "🤖" },
    { key: "localSearchScore", label: "Local Search", icon: "📍" },
    { key: "menuDiscoverabilityScore", label: "Menu", icon: "🍽️" },
    { key: "gbpHealthScore", label: "GBP Health", icon: "🏪" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Intelligence</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>Overall intelligence summary across your restaurants</p>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: spacing.md, marginBottom: spacing["2xl"] }}>
        <StatCard label="Restaurants" value={restaurants.length} color={colors.text} />
        <StatCard label="Avg Score" value={avgScore} color={scoreColor(avgScore)} />
        <StatCard label="Issues Found" value={totalIssues} color={totalIssues > 0 ? colors.danger : colors.success} />
      </div>

      {/* Category Breakdown */}
      <h2 style={{ ...typography.h2, margin: `0 0 ${spacing.lg}` }}>Category Breakdown</h2>
      <div style={{ display: "grid", gap: spacing.md, marginBottom: spacing["2xl"] }}>
        {categories.map((cat) => {
          const scores = restaurants.map((r: any) => r[cat.key] || 0);
          const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
          return (
            <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: spacing.lg, padding: spacing.lg, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: "1.5rem" }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ ...typography.body, margin: 0, fontWeight: 500 }}>{cat.label}</p>
                <div style={{ marginTop: spacing.xs, height: 6, background: colors.bg, borderRadius: radius.full, overflow: "hidden" }}>
                  <div style={{ width: `${avg}%`, height: "100%", background: scoreColor(avg), borderRadius: radius.full, transition: "width 0.3s" }} />
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: scoreColor(avg) }}>{avg}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <h2 style={{ ...typography.h2, margin: `0 0 ${spacing.lg}` }}>Explore</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: spacing.md }}>
        {[
          { href: "/dashboard/intelligence/analysis", label: "Analysis", icon: "📊" },
          { href: "/dashboard/intelligence/recommendations", label: "Recommendations", icon: "💡" },
          { href: "/dashboard/intelligence/visibility", label: "Visibility", icon: "👁️" },
          { href: "/dashboard/intelligence/competitors", label: "Competitors", icon: "🏆" },
          { href: "/dashboard/intelligence/reviews", label: "Reviews", icon: "⭐" },
          { href: "/dashboard/intelligence/website", label: "Website", icon: "🌐" },
          { href: "/dashboard/intelligence/search", label: "Search", icon: "🔍" },
        ].map((link) => (
          <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
            <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, cursor: "pointer", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", margin: `0 0 ${spacing.sm}` }}>{link.icon}</p>
              <p style={{ ...typography.body, margin: 0, fontWeight: 500, color: colors.text }}>{link.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
      <p style={{ ...typography.label, margin: 0 }}>{label}</p>
      <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "2rem", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

export default function IntelligencePage() {
  return <AuthProvider><IntelligenceOverviewPage /></AuthProvider>;
}
