"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function VisibilityPage() {
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

  const dimensions = [
    { key: "discoverabilityScore", label: "Discoverability", icon: "🔍" },
    { key: "aiVisibilityScore", label: "AI Visibility", icon: "🤖" },
    { key: "localSearchScore", label: "Local Search", icon: "📍" },
    { key: "menuDiscoverabilityScore", label: "Menu", icon: "🍽️" },
    { key: "conversationalSearchScore", label: "Conversational Search", icon: "🗣️" },
    { key: "dishRetrievalScore", label: "Dish Retrieval", icon: "🍛" },
    { key: "restaurantClarityScore", label: "Clarity", icon: "✨" },
    { key: "gbpHealthScore", label: "GBP Health", icon: "🏪" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Visibility</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>Search presence, maps, categories, and citations across your restaurants</p>
      {restaurants.length === 0 ? (
        <EmptyState icon="👁️" title="No visibility data" description="Add a restaurant and run an analysis." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
          {restaurants.map((r) => (
            <div key={r.id} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.lg}` }}>{r.name}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: spacing.md }}>
                {dimensions.map((d) => {
                  const val = r[d.key] || 0;
                  return (
                    <div key={d.key} style={{ padding: spacing.lg, background: colors.bg, borderRadius: radius.md }}>
                      <p style={{ fontSize: "1.5rem", margin: `0 0 ${spacing.xs}` }}>{d.icon}</p>
                      <p style={{ ...typography.caption, margin: 0 }}>{d.label}</p>
                      <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "1.5rem", fontWeight: 700, color: scoreColor(val) }}>{val}</p>
                    </div>
                  );
                })}
              </div>
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

export default function Visibility() { return <AuthProvider><VisibilityPage /></AuthProvider>; }
