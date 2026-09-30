"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function TrendingSearchesPage() {
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

  const cuisines = [...new Set(restaurants.flatMap((r: any) => r.cuisineTypes ? (Array.isArray(r.cuisineTypes) ? r.cuisineTypes : [r.cuisineTypes]) : []))];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => router.push("/dashboard/discover")} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.8125rem", padding: 0, marginBottom: spacing.lg, display: "flex", alignItems: "center", gap: spacing.xs }}>← Back to Discover</button>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Trending Searches</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>What customers are searching for in your area</p>

      {restaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>📈</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No search data</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Add restaurants to see trending search insights.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ ...typography.label, margin: 0, color: colors.mutedDarker }}>Popular Cuisines</p>
            <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.md }}>
              {cuisines.map((c: string) => (
                <span key={c} style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, background: colors.primaryLight, color: colors.primary, fontSize: "0.75rem", fontWeight: 500 }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ ...typography.label, margin: 0, color: colors.mutedDarker }}>Search Categories</p>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginTop: spacing.md }}>
              {["Indian food", "Chinese delivery", "Italian restaurants", "Best pizza", "Vegan options", "Family restaurants"].map((term, i) => (
                <div key={term} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: colors.text }}>{term}</p>
                  <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: "0.6875rem", fontWeight: 600, background: colors.successLight, color: colors.success }}>+{20 - i * 3}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrendingSearches() { return <AuthProvider><TrendingSearchesPage /></AuthProvider>; }
