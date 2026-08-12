"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    if (!token) return;
    setError("");
    try {
      const [rRes, uRes, oRes] = await Promise.all([
        fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${API}/api/organizations`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);
      const rData = await rRes.json();
      const restaurants = Array.isArray(rData) ? rData : rData.data || rData.restaurants || [];
      const users = uRes?.ok ? await uRes.json() : { data: [] };
      const orgs = oRes?.ok ? await oRes.json() : { data: [] };
      setStats({
        restaurants: restaurants.length,
        users: Array.isArray(users) ? users.length : (users.data || []).length,
        organizations: Array.isArray(orgs) ? orgs.length : (orgs.data || []).length,
        avgScore: restaurants.length > 0 ? Math.round(restaurants.reduce((s: number, r: any) => s + (r.discoverabilityScore || 0), 0) / restaurants.length) : 0,
        criticalCount: restaurants.filter((r: any) => (r.discoverabilityScore || 0) < 40).length,
        healthyCount: restaurants.filter((r: any) => (r.discoverabilityScore || 0) >= 70).length,
      });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, [token]);

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><LoadingSkeleton count={6} height="5rem" width="100%" /></div>;

  if (error) return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
        <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>{error}</p>
        <button onClick={fetchStats} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
      </div>
    </div>
  );

  const statCards = [
    { label: "Total Restaurants", value: stats.restaurants, icon: "🍽️", color: colors.primary },
    { label: "Total Users", value: stats.users, icon: "👥", color: colors.success },
    { label: "Organizations", value: stats.organizations, icon: "🏢", color: colors.warning },
    { label: "Avg Visibility Score", value: stats.avgScore, icon: "📊", color: stats.avgScore >= 50 ? colors.success : colors.danger },
    { label: "Need Attention", value: stats.criticalCount, icon: "⚠️", color: colors.danger },
    { label: "Healthy", value: stats.healthyCount, icon: "✅", color: colors.success },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Admin Dashboard</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>System overview and monitoring</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: spacing.md, marginBottom: spacing["2xl"] }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: "1.5rem", margin: `0 0 ${spacing.sm}` }}>{s.icon}</p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>System</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: spacing.md }}>
          {[
            { label: "Scans", icon: "🔍", href: "#" },
            { label: "Reports", icon: "📄", href: "/dashboard/reports" },
            { label: "Jobs", icon: "⚡", href: "#" },
            { label: "Monitoring", icon: "📈", href: "#" },
            { label: "Feature Flags", icon: "🚩", href: "#" },
            { label: "System Health", icon: "❤️", href: "#" },
          ].map((item) => (
            <div key={item.label} style={{ padding: spacing.lg, background: colors.bg, borderRadius: radius.md, cursor: "pointer", textAlign: "center" }}>
              <p style={{ fontSize: "1.25rem", margin: `0 0 ${spacing.xs}` }}>{item.icon}</p>
              <p style={{ ...typography.small, margin: 0, color: colors.muted }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Admin() { return <AuthProvider><AdminDashboard /></AuthProvider>; }
