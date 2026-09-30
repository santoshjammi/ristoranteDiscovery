"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function CompetitorsPage() {
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
      setRestaurants(Array.isArray(data) ? data : data.data || data.restaurants || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><LoadingSkeleton count={4} height="4rem" width="100%" /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Competitors</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>Compare your visibility against competitors</p>
      {restaurants.length === 0 ? (
        <EmptyState icon="🏆" title="No competitor data" description="Add a restaurant to see competitive comparisons." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {restaurants.map((r) => (
            <div key={r.id} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
                <h3 style={{ ...typography.h3, margin: 0 }}>{r.name}</h3>
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${scoreColor(r.discoverabilityScore || 0)}20`, color: scoreColor(r.discoverabilityScore || 0) }}>
                  Score: {r.discoverabilityScore || "—"}
                </span>
              </div>
              <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker }}>{r.city} · {r.cuisineTypes?.join ? r.cuisineTypes.join(", ") : r.cuisineTypes || "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
      <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>{icon}</p>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>{title}</h3>
      <p style={{ ...typography.small, margin: 0, color: colors.muted }}>{description}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
      <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>{message}</p>
      <button onClick={onRetry} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
    </div>
  );
}

export default function Competitors() { return <AuthProvider><CompetitorsPage /></AuthProvider>; }
