"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MasterScore, CategoryScoreStrip, ExpandableFactorCard, ProblemFactors, PendingFactors, type ScorecardData } from "@/components/scorecard/ScorecardComponents";
import { TrendSection, type SnapshotHistory } from "@/components/scorecard/TrendChart";
import { BenchmarkBar, type BenchmarkResult, type BenchmarkDimension } from "@/components/scorecard/BenchmarkBar";

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
  const [history, setHistory] = useState<SnapshotHistory | null>(null);
  const [historyRange, setHistoryRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [benchmarkDim, setBenchmarkDim] = useState<BenchmarkDimension>("city");

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

  const fetchHistory = async (range: "7d" | "30d" | "90d" | "all") => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`${API}/api/restaurants/${params.id}/scorecard/history?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data);
      }
    } catch {}
  };

  const fetchBenchmarks = async (dim: BenchmarkDimension) => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`${API}/api/restaurants/${params.id}/benchmarks?dimension=${dim}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data.data);
      }
    } catch {}
  };

  useEffect(() => { fetchScorecard(); }, [token, params.id]);
  useEffect(() => { fetchHistory(historyRange); }, [token, params.id, historyRange]);
  useEffect(() => { fetchBenchmarks(benchmarkDim); }, [token, params.id, benchmarkDim]);

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
  const liveFactors = allFactors.filter((f) => f.status !== "pending_observation");
  const pendingFactors = allFactors.filter((f) => f.status === "pending_observation");

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
  const expandedFactor = selectedFactorData && selectedFactorData.status !== "pending_observation" ? selectedFactor : null;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg }}>
        <button onClick={() => router.push("/dashboard/restaurants")} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.8125rem", padding: 0 }}>Restaurants</button>
        <span style={{ color: colors.mutedDarker, fontSize: "0.75rem" }}>/</span>
        <span style={{ fontSize: "0.8125rem", color: colors.text, fontWeight: 500 }}>{scorecard.restaurantName}</span>
      </div>

      {/* 1. Overall Restaurant Intelligence Score */}
      <MasterScore score={scorecard.overallScore} status={scorecard.overallStatus} liveFactors={scorecard.liveFactors} totalFactors={scorecard.totalFactors} lastUpdated={scorecard.lastUpdated} />

      {/* 2. Five category scores */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Category Scores</h3>
        <CategoryScoreStrip categories={scorecard.categories} />
      </div>

      {/* 2b. Historical trend */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <TrendSection
          title="Overall Score Trend"
          history={history}
          onRange={(r) => setHistoryRange(r)}
        />
      </div>

      {/* 2c. Benchmarking */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
            <div>
              <h3 style={{ ...typography.h3, margin: 0 }}>Benchmarking</h3>
              <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Compared to peers</p>
            </div>
            <div style={{ display: "flex", gap: spacing.xs }}>
              {(["city", "cuisine", "price", "competitors"] as BenchmarkDimension[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setBenchmarkDim(d)}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: radius.sm,
                    border: `1px solid ${benchmarkDim === d ? colors.primary : colors.border}`,
                    background: benchmarkDim === d ? colors.primaryLight : "transparent",
                    color: benchmarkDim === d ? colors.primary : colors.muted,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.625rem",
                    textTransform: "capitalize",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: spacing.md }}>
            {benchmarks.length === 0 && (
              <p style={{ ...typography.small, color: colors.muted }}>Loading benchmarks…</p>
            )}
            {benchmarks.map((b) => (
              <BenchmarkBar key={b.factorId} benchmark={b} />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Search / sort / filter */}
      <div style={{ display: "flex", gap: spacing.md, alignItems: "center", marginTop: spacing["2xl"], marginBottom: spacing.md, flexWrap: "wrap" }}>
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
      <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>
        Showing {filteredFactors.length} of {allFactors.length} factors · {liveFactors.length} measured · {pendingFactors.length} pending
      </p>

      {/* 4. 25-factor grid (expandable sub-signals) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: spacing.md }}>
        {filteredFactors.map((f) => (
          <ExpandableFactorCard
            key={f.id}
            factor={f}
            expanded={expandedFactor === f.id}
            onToggle={(id) => setSelectedFactor(selectedFactor === id ? null : id)}
          />
        ))}
      </div>

      {/* 5. Top problem factors */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <ProblemFactors factors={allFactors} onSelect={(id) => setSelectedFactor(id)} />
      </div>

      {/* 6. Pending Observation factors clearly separated */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <PendingFactors factors={allFactors} onSelect={(id) => setSelectedFactor(id)} />
      </div>
    </div>
  );
}

export default function RestaurantPage() {
  return <AuthProvider><ScorecardPage /></AuthProvider>;
}
