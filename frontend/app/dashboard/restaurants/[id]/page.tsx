"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MasterScore, CategoryScoreStrip, ExpandableFactorCard, ProblemFactors, PendingFactors, type ScorecardData } from "@/components/scorecard/ScorecardComponents";
import { TrendSection, type SnapshotHistory } from "@/components/scorecard/TrendChart";
import { BenchmarkBar, type BenchmarkResult, type BenchmarkDimension } from "@/components/scorecard/BenchmarkBar";
import { EvidenceTimeline, type TimelineEvent } from "@/components/scorecard/EvidenceTimeline";
import { ImpactSimulator, type ImpactSimulation } from "@/components/scorecard/ImpactSimulator";
import { ComparisonView, type RestaurantComparison } from "@/components/scorecard/ComparisonView";
import { CrossFactorView, type CrossFactorReport } from "@/components/scorecard/CrossFactorView";
import { DataProvenancePanel } from "@/components/evidence/DataProvenancePanel";
import { DataScanPanel } from "@/components/evidence/DataScanPanel";
import { fetchEvidence, type ProvenanceData } from "@/app/lib/discovery";

import { API } from "@/app/lib/api-config";

const benchmarkLabelMap: Record<BenchmarkDimension, string> = {
  city: "City",
  cuisine: "Cuisine",
  price: "Price",
  competitors: "Nearby competitors",
};

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
  const [advancedFilter, setAdvancedFilter] = useState<"all" | "low_confidence" | "incomplete_coverage" | "stale_evidence">("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState<string>("score_asc");
  const [history, setHistory] = useState<SnapshotHistory | null>(null);
  const [historyRange, setHistoryRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [benchmarkDim, setBenchmarkDim] = useState<BenchmarkDimension>("city");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [impacts, setImpacts] = useState<ImpactSimulation[]>([]);
  const [comparison, setComparison] = useState<RestaurantComparison | null>(null);
  const [crossFactor, setCrossFactor] = useState<CrossFactorReport | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceData | null>(null);
  const [provenanceLoading, setProvenanceLoading] = useState(true);

  const factorNameById = scorecard
    ? scorecard.categories.flatMap((c) => c.factors).reduce<Record<string, string>>((acc, f) => {
        acc[f.id] = f.name;
        return acc;
      }, {})
    : {};

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

  const fetchTimeline = async () => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`${API}/api/restaurants/${params.id}/scorecard/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTimeline(data.data?.events || []);
      }
    } catch {}
  };

  const fetchImpacts = async () => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`${API}/api/restaurants/${params.id}/scorecard/impact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setImpacts(data.data || []);
      }
    } catch {}
  };

  const fetchComparison = async () => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`${API}/api/restaurants/${params.id}/compare`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComparison(data.data);
      }
    } catch {}
  };

  const fetchCrossFactor = async () => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`${API}/api/restaurants/${params.id}/scorecard/relationships`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        const data = await res.json();
        setCrossFactor(data.data);
      }
    } catch {}
  };

  const fetchProvenance = async () => {
    if (!params.id) return;
    setProvenanceLoading(true);
    try {
      const data = await fetchEvidence(String(params.id));
      setProvenance(data);
    } catch {
      setProvenance(null);
    } finally {
      setProvenanceLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`${API}/api/restaurants/${params.id}/scorecard/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `intelligence-${scorecard?.restaurantName || params.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF download failed: ${err.message}`);
    }
  };

  useEffect(() => { fetchScorecard(); }, [token, params.id]);
  useEffect(() => { fetchHistory(historyRange); }, [token, params.id, historyRange]);
  useEffect(() => { fetchBenchmarks(benchmarkDim); }, [token, params.id, benchmarkDim]);
  useEffect(() => { fetchTimeline(); }, [token, params.id]);
  useEffect(() => { fetchImpacts(); }, [token, params.id]);
  useEffect(() => { fetchComparison(); }, [token, params.id]);
  useEffect(() => { fetchCrossFactor(); }, [token, params.id]);
  useEffect(() => { fetchProvenance(); }, [params.id]);

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
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = f.name.toLowerCase().includes(q);
      const descMatch = f.description.toLowerCase().includes(q);
      // spec §30: search also matches signal.key and signal.label
      const signalMatch = (f.signals ?? []).some(
        (s) => s.signalKey?.toLowerCase().includes(q) || s.label?.toLowerCase().includes(q)
      );
      if (!nameMatch && !descMatch && !signalMatch) return false;
    }
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    // Secondary advanced filters (spec §32)
    if (advancedFilter === "low_confidence" && !(f.status !== "pending_observation" && f.confidence !== null && f.confidence < 60)) return false;
    if (advancedFilter === "incomplete_coverage" && !(f.status !== "pending_observation" && f.totalSignalCount !== undefined && f.totalSignalCount > 0 && (f.measuredSignalCount ?? 0) < f.totalSignalCount)) return false;
    if (advancedFilter === "stale_evidence" && !((f.staleCount ?? 0) > 0)) return false;
    return true;
  }).sort((a, b) => {
    // spec §31: default = lowest score / greatest attention first
    switch (sortBy) {
      case "score_high":
        return (b.score ?? -1) - (a.score ?? -1);
      case "conf_low":
        return (a.confidence ?? 101) - (b.confidence ?? 101);
      case "evidence":
        return (b.evidenceCount ?? 0) - (a.evidenceCount ?? 0);
      case "pending":
        return (b.pendingSignalCount ?? 0) - (a.pendingSignalCount ?? 0);
      case "category": {
        const ca = scorecard.categories.find((c) => c.factors.some((f) => f.id === a.id));
        const cb = scorecard.categories.find((c) => c.factors.some((f) => f.id === b.id));
        return (ca?.name ?? "").localeCompare(cb?.name ?? "");
      }
      case "name":
        return a.name.localeCompare(b.name);
      case "score_asc":
      default:
        return (a.score ?? 101) - (b.score ?? 101);
    }
  });

  const selectedFactorData = selectedFactor ? allFactors.find((f) => f.id === selectedFactor) : null;
  const expandedFactor = selectedFactorData && selectedFactorData.status !== "pending_observation" ? selectedFactor : null;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <button onClick={() => router.push("/dashboard/restaurants")} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.8125rem", padding: 0 }}>Restaurants</button>
          <span style={{ color: colors.mutedDarker, fontSize: "0.75rem" }}>/</span>
          <span style={{ fontSize: "0.8125rem", color: colors.text, fontWeight: 500 }}>{scorecard.restaurantName}</span>
        </div>
        <button onClick={downloadPDF} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.md, border: `1px solid ${colors.primary}`, background: colors.primaryLight, color: colors.primary, fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}>
          ⬇ Download PDF
        </button>
      </div>

      {/* 1. Overall Restaurant Intelligence Score */}
      <MasterScore score={scorecard.overallScore} status={scorecard.overallStatus} liveFactors={scorecard.liveFactors} totalFactors={scorecard.totalFactors} lastUpdated={scorecard.lastUpdated} />

      {/* 1b. Real-data provenance — the "prove it" surface */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <DataProvenancePanel data={provenance} loading={provenanceLoading} />
      </div>

      {/* 1c. On-demand scan — discover all available public data */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <DataScanPanel restaurantId={String(params.id)} />
      </div>

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
              <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.muted }}>
                <strong>Formula:</strong> we compare this restaurant against a peer set, then show whether each factor sits above or below the peer median. <strong>City</strong> = restaurants in the same city. <strong>Cuisine</strong> = restaurants with the same primary cuisine. <strong>Price</strong> = restaurants in the same price tier. <strong>Nearby competitors</strong> = the closest mapped competitors around this restaurant.
              </p>
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
                  {benchmarkLabelMap[d]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: spacing.md }}>
            {benchmarks.length === 0 && (
              <p style={{ ...typography.small, color: colors.muted }}>Loading benchmarks…</p>
            )}
            {benchmarks.map((b) => (
              <BenchmarkBar key={b.factorId} benchmark={{ ...b, factorName: factorNameById[b.factorId] }} />
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
          <option value="score_asc">Sort: Lowest score</option>
          <option value="score_high">Sort: Highest score</option>
          <option value="conf_low">Sort: Lowest confidence</option>
          <option value="evidence">Sort: Most evidence</option>
          <option value="pending">Sort: Most pending</option>
          <option value="category">Sort: Category</option>
          <option value="name">Sort: Alphabetical</option>
        </select>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, border: `1px solid ${colors.borderLight}`, background: "transparent", color: colors.muted, fontSize: "0.75rem", cursor: "pointer",
          }}
        >
          Advanced {showAdvanced ? "▾" : "▸"}
        </button>
      </div>
      {/* Secondary advanced filters (spec §32) — collapsed/section, kept secondary */}
      {showAdvanced && (
        <div style={{ display: "flex", gap: spacing.md, alignItems: "center", marginBottom: spacing.lg, flexWrap: "wrap" }}>
          <select
            value={advancedFilter}
            onChange={(e) => setAdvancedFilter(e.target.value as any)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.75rem", cursor: "pointer",
            }}
          >
            <option value="all">All factors</option>
            <option value="low_confidence">Low Confidence</option>
            <option value="incomplete_coverage">Incomplete Coverage</option>
            <option value="stale_evidence">Stale Evidence</option>
          </select>
          <span style={{ ...typography.caption, color: colors.mutedDarker }}>Advanced filters help you spot signals that need attention.</span>
        </div>
      )}
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

      {/* 5b. Evidence timeline */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <EvidenceTimeline events={timeline} />
      </div>

      {/* 5c. Impact simulation */}
      <div style={{ marginTop: spacing["2xl"] }}>
        <ImpactSimulator impacts={impacts} />
      </div>

      {/* 5d. Competitive comparison */}
      {comparison && comparison.competitors.length > 0 && (
        <div style={{ marginTop: spacing["2xl"] }}>
          <ComparisonView comparison={comparison} />
        </div>
      )}

      {/* 5e. Cross-factor relationships */}
      {crossFactor && (
        <div style={{ marginTop: spacing["2xl"] }}>
          <CrossFactorView report={crossFactor} />
        </div>
      )}

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
