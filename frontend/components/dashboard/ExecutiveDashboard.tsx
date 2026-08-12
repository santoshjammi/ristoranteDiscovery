"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Restaurant, fetchRestaurants } from "@/app/lib/api";
import { analyzeRestaurant, type AnalyzeResponse } from "@/app/lib/discovery";
import { Scorecard } from "@/components/scorecard/Scorecard";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { RecommendationCard } from "@/components/recommendation/RecommendationCard";

export default function ExecutiveDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Map<string, AnalyzeResponse>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurants()
      .then(setRestaurants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (id: string) => {
    setAnalyzing(id);
    try {
      const result = await analyzeRestaurant(id);
      setAnalysis((prev) => new Map(prev).set(id, result));
      setSelectedId(id);
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const selectedAnalysis = selectedId ? analysis.get(selectedId) : null;
  const selectedRestaurant = restaurants.find((r) => r.id === selectedId);

  return (
    <div className="dashboard">
      {/* Global Nav */}
      <nav className="global-nav">
        <div className="global-nav-inner">
          <ul className="global-nav-links">
            <li><a href="/" style={{ fontWeight: 700, color: "var(--green-starbucks)" }}>Ristorante</a></li>
            <li><a href="/">Dashboard</a></li>
            <li><a href="/">Restaurants</a></li>
          </ul>
          <div className="global-nav-actions">
            <Link href="/restaurants/new" className="btn-primary">+ Add Restaurant</Link>
          </div>
        </div>
      </nav>
      <div style={{ height: "7.2rem" }} />

      {/* Hero */}
      <section className="feature-band" style={{ padding: "3.2rem 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2.4rem" }}>
          <h1 className="h1" style={{ color: "var(--text-white)", fontSize: "2.8rem", marginBottom: "0.4rem" }}>
            Executive Dashboard
          </h1>
          <p className="body" style={{ color: "var(--text-white-soft)" }}>
            {restaurants.length} restaurants tracked
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "2.4rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "6.4rem 0", color: "var(--text-soft)" }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "2.4rem", alignItems: "start" }}>
            {/* Restaurant List */}
            <div className="card" style={{ padding: "1.6rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.2rem", color: "var(--text-black)" }}>
                Restaurants
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleAnalyze(r.id)}
                    disabled={analyzing === r.id}
                    className="restaurant-list-item"
                    style={{
                      background: selectedId === r.id ? "var(--green-light)" : "transparent",
                      border: selectedId === r.id ? "1px solid var(--green-accent)" : "1px solid var(--hairline)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "1.4rem", color: "var(--text-black)" }}>{r.name}</div>
                      <div style={{ fontSize: "1.2rem", color: "var(--text-soft)" }}>
                        {r.city} · {r.discoverabilityScore}
                      </div>
                    </div>
                    {analyzing === r.id && <span style={{ fontSize: "1.2rem", color: "var(--text-soft)" }}>…</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Analysis Panel */}
            <div>
              {!selectedAnalysis ? (
                <div className="card" style={{ padding: "4.8rem", textAlign: "center" }}>
                  <p style={{ color: "var(--text-soft)", fontSize: "1.6rem" }}>
                    Select a restaurant to analyze
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2.4rem" }}>
                  {/* Scorecard */}
                  <Scorecard data={selectedAnalysis.scorecard} />

                  {/* Recommendations */}
                  <div>
                    <h2 style={{ fontSize: "1.6rem", fontWeight: 600, marginBottom: "1.2rem", color: "var(--text-black)" }}>
                      Recommendations ({selectedAnalysis.recommendations.length})
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                      {selectedAnalysis.recommendations.map((r) => (
                        <RecommendationCard key={r.id} recommendation={r} />
                      ))}
                    </div>
                  </div>

                  {/* Evidence */}
                  <EvidencePanel evidence={selectedAnalysis.evidence} />

                  {/* Report Summary */}
                  <div className="card" style={{ padding: "2rem 2.4rem" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.2rem", color: "var(--text-black)" }}>
                      Executive Summary
                    </h2>
                    <div style={{ display: "flex", gap: "2.4rem", marginBottom: "1.2rem" }}>
                      <div>
                        <div style={{ fontSize: "1.1rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Score</div>
                        <div style={{ fontSize: "2.4rem", fontWeight: 700, color: selectedAnalysis.report.executiveSummary.overallScore >= 70 ? "var(--status-excellent)" : "var(--status-fair)" }}>
                          {selectedAnalysis.report.executiveSummary.overallScore}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "1.1rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Trend</div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--trend-up)" }}>
                          {selectedAnalysis.report.executiveSummary.trend === "up" ? "↑ Improving" : selectedAnalysis.report.executiveSummary.trend === "down" ? "↓ Declining" : "→ Stable"}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: "1.2rem" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-soft)", marginBottom: "0.4rem" }}>Findings</div>
                      {selectedAnalysis.report.executiveSummary.topFindings.map((f, i) => (
                        <div key={i} style={{ fontSize: "1.3rem", color: "var(--text-black)", padding: "0.2rem 0" }}>· {f}</div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-soft)", marginBottom: "0.4rem" }}>Top Recommendations</div>
                      {selectedAnalysis.report.executiveSummary.topRecommendations.map((r, i) => (
                        <div key={i} style={{ fontSize: "1.3rem", color: "var(--green-accent)", padding: "0.2rem 0" }}>→ {r}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: var(--canvas);
        }
        .restaurant-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 1rem 1.2rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          font-family: var(--font);
          transition: all 0.15s;
        }
        .restaurant-list-item:hover {
          border-color: var(--green-accent) !important;
        }
        .restaurant-list-item:disabled {
          opacity: 0.6;
          cursor: wait;
        }
      `}</style>
    </div>
  );
}
