"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

function AnalysisPage() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
      setRestaurants(list);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  const runAnalysis = async (id: string) => {
    if (!token) return;
    setAnalyzing(id);
    try {
      await fetch(`${API}/api/restaurants/${id}/analyze`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch {} finally { setAnalyzing(null); }
  };

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><LoadingSkeleton count={4} height="4rem" width="100%" /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Analysis</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}` }}>Run and view analyses for your restaurants</p>
      {restaurants.length === 0 ? (
        <EmptyState icon="📊" title="No restaurants yet" description="Add a restaurant to run an analysis." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {restaurants.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <div>
                <p style={{ ...typography.body, margin: 0, fontWeight: 500 }}>{r.name}</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Score: {r.discoverabilityScore || "—"}</p>
              </div>
              <button onClick={() => runAnalysis(r.id)} disabled={analyzing === r.id} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.md, border: "none", background: analyzing === r.id ? colors.muted : colors.primary, color: "#fff", fontWeight: 600, cursor: analyzing === r.id ? "not-allowed" : "pointer", fontSize: "0.875rem" }}>
                {analyzing === r.id ? "Analyzing..." : "Run Analysis"}
              </button>
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
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
        <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load</p>
        <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}` }}>{message}</p>
        <button onClick={onRetry} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
      </div>
    </div>
  );
}

export default function Analysis() { return <AuthProvider><AnalysisPage /></AuthProvider>; }
