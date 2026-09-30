"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function OutcomesPage() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
        const restaurantIds = list.map((r: any) => r.id).join(",");
        let withStats: any[] = [];
        if (restaurantIds) {
          const oRes = await fetch(`${API}/api/outcomes/batch?restaurantIds=${encodeURIComponent(restaurantIds)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          if (oRes.ok) {
            const oData = await oRes.json();
            const statsMap = new Map((oData.data || []).map((s: any) => [s.restaurantId, s]));
            withStats = list.map((r: any) => ({ ...r, outcomes: statsMap.get(r.id) || { total: 0, completed: 0 } }));
          }
        }
        if (!cancelled) setRestaurants(withStats);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, retryCount]);

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Outcomes</h1><LoadingSkeleton count={4} height="4rem" width="100%" /></div>;

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Outcomes</h1>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load outcomes</p>
          <button onClick={() => setRetryCount(n => n + 1)} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      </div>
    );
  }

  const totalCompleted = restaurants.reduce((sum, r) => sum + (r.outcomes?.completed || 0), 0);
  const totalOutcomes = restaurants.reduce((sum, r) => sum + (r.outcomes?.total || 0), 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Outcomes</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>Track business improvements across your restaurants</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: spacing.md, marginBottom: spacing["2xl"] }}>
        <StatCard label="Total Outcomes" value={totalOutcomes} color={colors.text} />
        <StatCard label="Completed" value={totalCompleted} color={colors.success} />
        <StatCard label="Completion Rate" value={totalOutcomes > 0 ? Math.round((totalCompleted / totalOutcomes) * 100) + "%" : "0%"} color={totalCompleted > 0 ? colors.success : colors.muted} />
      </div>

      {restaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>📈</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No outcomes yet</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Complete recommendations to track outcomes.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {restaurants.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <div>
                <p style={{ ...typography.body, margin: 0, fontWeight: 500 }}>{r.name}</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{r.city}</p>
              </div>
              <div style={{ display: "flex", gap: spacing.xl, textAlign: "center" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: colors.text }}>{r.outcomes?.total || 0}</p>
                  <p style={{ ...typography.caption, margin: 0 }}>Total</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: colors.success }}>{r.outcomes?.completed || 0}</p>
                  <p style={{ ...typography.caption, margin: 0 }}>Done</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
      <p style={{ ...typography.label, margin: 0 }}>{label}</p>
      <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "2rem", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

export default function Outcomes() {
  return <AuthProvider><OutcomesPage /></AuthProvider>;
}
