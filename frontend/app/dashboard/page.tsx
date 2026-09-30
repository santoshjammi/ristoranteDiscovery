"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function DashboardHome() {
  const { token, organization } = useAuth();
  const [stats, setStats] = useState({ restaurants: 0, avgScore: 0, needsAttention: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    if (!token) return;
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
      const scores = list.map((r: any) => r.discoverabilityScore || 0);
      setStats({
        restaurants: list.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0,
        needsAttention: scores.filter((s: number) => s < 50).length,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ maxWidth: 900 }}>
        <LoadingSkeleton count={1} height="1.5rem" width="40%" />
        <div style={{ marginTop: spacing.xl, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: spacing.md }}>
          <LoadingSkeleton count={3} height="4rem" width="100%" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{ maxWidth: 900 }}>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load dashboard</p>
          <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}` }}>{error}</p>
          <button onClick={fetchStats} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Welcome */}
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>
        Welcome{organization ? `, ${organization.name}` : ""}
      </h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>
        Here's an overview of your restaurant portfolio
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: spacing.md, marginBottom: spacing["2xl"] }}>
        <StatCard label="Restaurants" value={stats.restaurants} color={colors.text} />
        <StatCard label="Avg Score" value={stats.avgScore} color={scoreColor(stats.avgScore)} />
        <StatCard label="Need Attention" value={stats.needsAttention} color={stats.needsAttention > 0 ? colors.danger : colors.success} />
      </div>

      {/* Empty State */}
      {stats.restaurants === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>🍽️</p>
          <h2 style={{ ...typography.h2, margin: `0 0 ${spacing.sm}` }}>Get started</h2>
          <p style={{ ...typography.small, margin: `0 0 ${spacing.xl}`, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
            Add your first restaurant to begin analyzing your visibility and getting actionable recommendations.
          </p>
          <Link
            href="/dashboard/restaurants"
            style={{
              padding: `${spacing.sm} ${spacing.xl}`,
              borderRadius: radius.md,
              background: colors.primary,
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "inline-block",
            }}
          >
            Add Restaurant
          </Link>
        </div>
      ) : (
        /* Quick Actions */
        <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Quick Actions</h3>
          <div style={{ display: "flex", gap: spacing.md, flexWrap: "wrap" }}>
            <ActionLink href="/dashboard/restaurants" label="View All Restaurants" />
            <ActionLink href="/dashboard/reports" label="View Reports" />
            <ActionLink href="/dashboard/intelligence/recommendations" label="View Recommendations" />
          </div>
        </div>
      )}
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

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        padding: `${spacing.sm} ${spacing.lg}`,
        borderRadius: radius.md,
        background: colors.primaryLight,
        color: colors.primary,
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      {label}
    </Link>
  );
}

export default function DashboardPage() {
  return <AuthProvider><DashboardHome /></AuthProvider>;
}
