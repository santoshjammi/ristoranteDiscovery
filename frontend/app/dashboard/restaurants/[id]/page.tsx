"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MasterScore, CategoryCard, statusColor, type ScorecardData } from "@/components/scorecard/ScorecardComponents";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

function ScorecardPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const fetchScorecard = async () => {
    if (!token || !params.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants/${params.id}/scorecard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load scorecard");
      const data = await res.json();
      setScorecard(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScorecard(); }, [token, params.id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <LoadingSkeleton count={1} height="8rem" width="60%" />
        <div style={{ marginTop: spacing.xl }}><LoadingSkeleton count={5} height="12rem" width="100%" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>{error}</p>
          <button onClick={() => router.back()} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>← Go Back</button>
        </div>
      </div>
    );
  }

  if (!scorecard) return null;

  // Flatten all factors for search/filter/sort
  const allFactors = scorecard.categories.flatMap((c) => c.factors);
  const filteredFactors = allFactors.filter((f) => {
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !f.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "score") return (b.score ?? -1) - (a.score ?? -1);
    if (sortBy === "status") return a.status.localeCompare(b.status);
    if (sortBy === "category") {
      const ca = scorecard.categories.find((c) => c.factors.some((f) => f.id === a.id));
      const cb = scorecard.categories.find((c) => c.factors.some((f) => f.id === b.id));
      return (ca?.name ?? "").localeCompare(cb?.name ?? "");
    }
    return a.name.localeCompare(b.name);
  });

  const selectedFactorData = selectedFactor ? allFactors.find((f) => f.id === selectedFactor) : null;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg }}>
        <button onClick={() => router.push("/dashboard/restaurants")} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.8125rem", padding: 0 }}>Restaurants</button>
        <span style={{ color: colors.mutedDarker, fontSize: "0.75rem" }}>/</span>
        <span style={{ fontSize: "0.8125rem", color: colors.text, fontWeight: 500 }}>{scorecard.restaurantName}</span>
      </div>

      {/* Master Score */}
      <MasterScore score={scorecard.overallScore} status={scorecard.overallStatus} liveFactors={scorecard.liveFactors} totalFactors={scorecard.totalFactors} />

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: spacing.md, alignItems: "center", marginTop: spacing["2xl"], marginBottom: spacing.xl, flexWrap: "wrap" }}>
        <input
          placeholder="Search factors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.8125rem", outline: "none",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.8125rem", cursor: "pointer",
          }}
        >
          <option value="all">All Status</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="needs_attention">Needs Attention</option>
          <option value="critical">Critical</option>
          <option value="pending_observation">Pending Observation</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.8125rem", cursor: "pointer",
          }}
        >
          <option value="name">Sort: Name</option>
          <option value="score">Sort: Score</option>
          <option value="status">Sort: Status</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      {/* Factor summary bar */}
      <div style={{ marginBottom: spacing.xl }}>
        <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker }}>
          Showing {filteredFactors.length} of {allFactors.length} factors
          {sortBy === "category" ? " — sorted by category" : ""}
        </p>
      </div>

      {/* Factor Detail Panel */}
      {selectedFactorData && (
        <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.primary}`, marginBottom: spacing.xl }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md }}>
            <div>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: colors.text }}>{selectedFactorData.name}</p>
              <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{selectedFactorData.description}</p>
            </div>
            <button onClick={() => setSelectedFactor(null)} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.875rem", padding: 0 }}>✕</button>
          </div>
          {selectedFactorData.score !== null ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: spacing.md }}>
              <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>Current Score</p>
                <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "1.5rem", fontWeight: 700, color: colors.text }}>{selectedFactorData.score}</p>
              </div>
              <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>Business Impact</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.text }}>{selectedFactorData.businessImpact}</p>
              </div>
              <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>Expected Improvement</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.success }}>{selectedFactorData.expectedImprovement}</p>
              </div>
              <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md }}>
                <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>Recommended Actions</p>
                <ul style={{ margin: `${spacing.xs} 0 0`, paddingLeft: spacing.lg, fontSize: "0.75rem", color: colors.muted }}>
                  {selectedFactorData.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ padding: spacing.lg, background: colors.bg, borderRadius: radius.md }}>
              <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker, fontStyle: "italic" }}>
                This factor requires {selectedFactorData.connectorRequired || "a data connector"} to be measured. It will become available once the connector is configured.
              </p>
            </div>
          )}

          {/* Sub-signal evidence drill-down */}
          {selectedFactorData.subSignals.length > 0 && (
            <div style={{ marginTop: spacing.lg, padding: spacing.lg, background: colors.bg, borderRadius: radius.md }}>
              <p style={{ ...typography.label, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6875rem", fontWeight: 600 }}>Supporting Sub-Signals</p>
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
                {selectedFactorData.subSignals.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: spacing.md, background: colors.surface, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>{s.name}</p>
                      {s.evidence.length > 0 && (
                        <ul style={{ margin: `${spacing.xs} 0 0`, paddingLeft: spacing.lg, fontSize: "0.6875rem", color: colors.mutedDarker }}>
                          {s.evidence.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                      {s.evidence.length === 0 && (
                        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker, fontStyle: "italic" }}>No supporting evidence yet — pending observation</p>
                      )}
                    </div>
                    <span style={{ marginLeft: spacing.md, fontSize: "0.875rem", fontWeight: 700, color: s.score !== null ? statusColor(s.status) : colors.mutedDarker }}>
                      {s.score !== null ? s.score : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
        {scorecard.categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} onFactorSelect={setSelectedFactor} />
        ))}
      </div>

      {/* Priority Opportunities */}
      <div style={{ marginTop: spacing["2xl"], padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Priority Opportunities</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {allFactors
            .filter((f) => f.status === "needs_attention" || f.status === "critical")
            .slice(0, 5)
            .map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.md, background: colors.bg, borderRadius: radius.md, cursor: "pointer" }}
                onClick={() => setSelectedFactor(f.id)}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>{f.name}</p>
                  <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{f.expectedImprovement}</p>
                </div>
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: "0.6875rem", fontWeight: 600, background: f.status === "critical" ? colors.dangerLight : `${colors.warning}20`, color: f.status === "critical" ? colors.danger : colors.warning }}>
                  {f.status === "critical" ? "Critical" : "Needs Attention"}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantPage() {
  return <AuthProvider><ScorecardPage /></AuthProvider>;
}
