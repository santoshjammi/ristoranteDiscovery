"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

type RestaurantLite = {
  id: string;
  name: string;
  address: string;
  city: string;
  website?: string | null;
  discoverabilityScore?: number;
};

type DuplicateGroup = { key: string; restaurants: RestaurantLite[] };

function normalize(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<RestaurantLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergeStatus, setMergeStatus] = useState("");

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
      const list = Array.isArray(rData) ? rData : rData.data || rData.restaurants || [];
      setRestaurants(list);
      const users = uRes?.ok ? await uRes.json() : { data: [] };
      const orgs = oRes?.ok ? await oRes.json() : { data: [] };
      setStats({
        restaurants: list.length,
        users: Array.isArray(users) ? users.length : (users.data || []).length,
        organizations: Array.isArray(orgs) ? orgs.length : (orgs.data || []).length,
        avgScore: list.length > 0 ? Math.round(list.reduce((s: number, r: any) => s + (r.discoverabilityScore || 0), 0) / list.length) : 0,
        criticalCount: list.filter((r: any) => (r.discoverabilityScore || 0) < 40).length,
        healthyCount: list.filter((r: any) => (r.discoverabilityScore || 0) >= 70).length,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [token]);

  const duplicateGroups = useMemo<DuplicateGroup[]>(() => {
    const map = new Map<string, RestaurantLite[]>();
    for (const r of restaurants) {
      const key = [normalize(r.name), normalize(r.address), normalize(r.city), normalize(r.website || "")].join("|");
      const bucket = map.get(key) || [];
      bucket.push(r);
      map.set(key, bucket);
    }
    return [...map.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => ({ key, restaurants: group }));
  }, [restaurants]);

  const copyGroup = async (group: DuplicateGroup) => {
    const text = group.restaurants.map((r) => `${r.name} · ${r.address} · ${r.city} · ${r.id}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopyStatus(`Copied ${group.restaurants.length} restaurant IDs`);
    setTimeout(() => setCopyStatus(""), 2000);
  };

  const mergeSelected = async () => {
    if (!token || selectedIds.length < 2) {
      setMergeStatus("Select at least two restaurants to merge.");
      return;
    }
    const keeperId = selectedIds[0];
    const mergeIds = selectedIds.slice(1);
    setMerging(true);
    setMergeStatus("");
    try {
      const res = await fetch(`${API}/api/restaurants/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ keeperId, mergeIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.details || "Failed to merge restaurants");
      }
      setSelectedIds([]);
      setMergeStatus("Merged selected restaurants successfully.");
      await fetchStats();
    } catch (err: any) {
      setMergeStatus(err.message || "Failed to merge restaurants");
    } finally {
      setMerging(false);
    }
  };

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
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl }}>
        <div>
          <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Admin Dashboard</h1>
          <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker }}>System overview, monitoring, and manual duplicate merge</p>
        </div>
        <Link href="/restaurants/new" style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.md, background: colors.primary, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem", whiteSpace: "nowrap" }}>
          + Add Restaurant
        </Link>
      </div>


      {copyStatus && (
        <div style={{ marginBottom: spacing.md, padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, background: colors.primaryLight, color: colors.primary, fontSize: "0.875rem" }}>
          {copyStatus}
        </div>
      )}

      {mergeStatus && (
        <div style={{ marginBottom: spacing.md, padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, background: colors.bg, color: colors.text, fontSize: "0.875rem", border: `1px solid ${colors.border}` }}>
          {mergeStatus}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, background: colors.bg, border: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.md }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: colors.text }}>{selectedIds.length} selected</p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: colors.mutedDarker }}>Pick one keeper first; the rest will be merged into it.</p>
          </div>
          <button disabled={merging || selectedIds.length < 2} onClick={mergeSelected} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.md, border: "none", background: merging || selectedIds.length < 2 ? colors.mutedDarker : colors.primary, color: "#fff", cursor: merging || selectedIds.length < 2 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.875rem" }}>
            {merging ? "Merging…" : "Merge Selected"}
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: spacing.md, marginBottom: spacing["2xl"] }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: "1.5rem", margin: `0 0 ${spacing.sm}` }}>{s.icon}</p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing["2xl"] }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>Manual Duplicate Merge</h3>
        <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>
          Select different restaurants manually. The first selected restaurant will be kept.
        </p>
        {duplicateGroups.length === 0 ? (
          <p style={{ ...typography.small, color: colors.success, margin: 0 }}>No exact duplicates found.</p>
        ) : (
          <div style={{ display: "grid", gap: spacing.md }}>
            {duplicateGroups.slice(0, 20).map((group) => (
              <div key={group.key} style={{ padding: spacing.lg, background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: spacing.md, alignItems: "center", marginBottom: spacing.sm }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: colors.text }}>{group.restaurants[0].name}</p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: colors.mutedDarker }}>{group.restaurants[0].address} · {group.restaurants[0].city}</p>
                  </div>
                  <button onClick={() => copyGroup(group)} style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.875rem" }}>
                    Copy IDs
                  </button>
                </div>
                <div style={{ display: "grid", gap: spacing.xs }}>
                  {group.restaurants.map((r, idx) => {
                    const checked = selectedIds.includes(r.id);
                    return (
                      <label key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: spacing.md, alignItems: "center", padding: `${spacing.xs} 0`, borderTop: `1px solid ${colors.border}`, cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedIds((prev) => {
                                if (e.target.checked) {
                                  return idx === 0 ? [r.id, ...prev.filter((id) => id !== r.id)] : [...prev.filter((id) => id !== r.id), r.id];
                                }
                                return prev.filter((id) => id !== r.id);
                              });
                            }}
                          />
                          <span style={{ fontSize: "0.875rem", color: colors.text }}>{r.id}</span>
                        </div>
                        <Link href={`/dashboard/restaurants/${r.id}`} style={{ color: colors.primary, textDecoration: "none", fontSize: "0.875rem" }}>Open</Link>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
