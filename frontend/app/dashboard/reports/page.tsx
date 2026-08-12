"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

interface RestaurantSummary {
  id: string;
  name: string;
  city: string;
  discoverabilityScore: number;
}

interface DecisionStats {
  total: number;
  accepted: number;
  completed: number;
  dismissed: number;
}

interface OutcomeStats {
  total: number;
  completed: number;
}

interface WeeklySummary {
  period: { start: string; end: string };
  stats: { totalDecisions: number; pending: number; accepted: number; completed: number; completedOutcomes: number };
  newDecisions: number;
  improvements: number;
  risks: string[];
  lastAnalysis: string | null;
}

function scoreColor(s: number): string {
  if (s >= 70) return "#22c55e";
  if (s >= 40) return "#f59e0b";
  return "#ef4444";
}

function ReportsPage() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decisionStats, setDecisionStats] = useState<DecisionStats | null>(null);
  const [outcomeStats, setOutcomeStats] = useState<OutcomeStats | null>(null);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchRestaurants = async () => {
    if (!token) return;
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
      setRestaurants(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (id: string) => {
    setStatsLoading(true);
    setSelectedId(id);
    try {
      const [decRes, outRes, sumRes] = await Promise.all([
        fetch(`${API}/api/restaurants/${id}/decision-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/restaurants/${id}/outcome-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/restaurants/${id}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (decRes.ok) {
        const d = await decRes.json();
        setDecisionStats(d.data);
      }
      if (outRes.ok) {
        const o = await outRes.json();
        setOutcomeStats(o.data);
      }
      if (sumRes.ok) {
        const s = await sumRes.json();
        setSummary(s.data);
      }
    } catch {
      // partial data is fine
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [token]);

  // ── Loading State ──
  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>Reports</h1>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ padding: "1.25rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)", opacity: 0.5 }}>
              <div style={{ width: "50%", height: "1rem", background: "var(--color-border, #334155)", borderRadius: "0.25rem", marginBottom: "0.5rem" }} />
              <div style={{ width: "30%", height: "0.75rem", background: "var(--color-border, #334155)", borderRadius: "0.25rem" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>Reports</h1>
        <div style={{ padding: "2rem", textAlign: "center", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          <p style={{ fontSize: "1rem", color: "#ef4444", margin: "0 0 0.5rem" }}>Failed to load</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)", margin: "0 0 1rem" }}>{error}</p>
          <button onClick={fetchRestaurants} style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid var(--color-border, #334155)", background: "transparent", color: "var(--color-text, #f1f5f9)", cursor: "pointer", fontSize: "0.8125rem" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (restaurants.length === 0) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>Reports</h1>
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)" }}>
          <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>📄</p>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
            No reports yet
          </h2>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>
            Add a restaurant and run an analysis to generate reports.
          </p>
          <Link
            href="/dashboard/restaurants"
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "var(--color-primary, #3b82f6)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Add Restaurant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>Reports</h1>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)" }}>
        Select a restaurant to view decision outcomes, weekly summaries, and audit reports.
      </p>

      {/* Restaurant List */}
      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {restaurants.map((r) => {
          const score = r.discoverabilityScore || 0;
          const isSelected = selectedId === r.id;
          return (
            <div key={r.id}>
              <button
                onClick={() => fetchStats(r.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 1.25rem",
                  background: isSelected ? "rgba(59, 130, 246, 0.08)" : "var(--color-surface, #1e293b)",
                  borderRadius: "0.75rem",
                  border: isSelected ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid var(--color-border, #334155)",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "inherit",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
                    {r.name}
                  </p>
                  <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
                    {r.city} · Score: {score}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Link
                    href={`/dashboard/audit/${r.id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px solid var(--color-primary, #3b82f6)",
                      color: "var(--color-primary, #3b82f6)",
                      textDecoration: "none",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    View Audit
                  </Link>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: scoreColor(score),
                    }}
                  />
                </div>
              </button>

              {/* Expanded Stats Panel */}
              {isSelected && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "1.25rem",
                    background: "var(--color-surface, #1e293b)",
                    borderRadius: "0.75rem",
                    border: "1px solid var(--color-border, #334155)",
                  }}
                >
                  {statsLoading ? (
                    <p style={{ color: "var(--color-muted, #94a3b8)", fontSize: "0.8125rem", margin: 0 }}>
                      Loading stats...
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {/* Decision Stats */}
                      {decisionStats && (
                        <div>
                          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Decision Activity
                          </h3>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                            <StatBox label="Total" value={decisionStats.total} color="var(--color-text, #f1f5f9)" />
                            <StatBox label="Accepted" value={decisionStats.accepted} color="#22c55e" />
                            <StatBox label="Completed" value={decisionStats.completed} color="#3b82f6" />
                            <StatBox label="Dismissed" value={decisionStats.dismissed} color="#6b7280" />
                          </div>
                        </div>
                      )}

                      {/* Outcome Stats */}
                      {outcomeStats && (
                        <div>
                          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Outcomes
                          </h3>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                            <StatBox label="Total Outcomes" value={outcomeStats.total} color="var(--color-text, #f1f5f9)" />
                            <StatBox label="Completed" value={outcomeStats.completed} color="#22c55e" />
                          </div>
                        </div>
                      )}

                      {/* Weekly Summary */}
                      {summary && (
                        <div>
                          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Weekly Summary
                          </h3>
                          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
                            {new Date(summary.period.start).toLocaleDateString()} —{" "}
                            {new Date(summary.period.end).toLocaleDateString()}
                          </p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                            <StatBox label="Decisions" value={summary.stats.totalDecisions} color="var(--color-text, #f1f5f9)" />
                            <StatBox label="New" value={summary.newDecisions} color="#3b82f6" />
                            <StatBox label="Completed" value={summary.improvements} color="#22c55e" />
                          </div>
                          {summary.risks.length > 0 && (
                            <div
                              style={{
                                marginTop: "0.75rem",
                                padding: "0.5rem 0.75rem",
                                background: "rgba(239, 68, 68, 0.1)",
                                borderRadius: "0.375rem",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                              }}
                            >
                              <p style={{ margin: 0, fontSize: "0.75rem", color: "#ef4444" }}>
                                ⚠ {summary.risks[0]}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {!decisionStats && !outcomeStats && !summary && (
                        <p style={{ color: "var(--color-muted, #94a3b8)", fontSize: "0.8125rem", margin: 0 }}>
                          No data yet. Run an analysis to generate reports.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        padding: "0.75rem",
        background: "var(--color-bg, #0f172a)",
        borderRadius: "0.5rem",
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color }}>{value}</p>
      <p style={{ margin: "0.125rem 0 0", fontSize: "0.6875rem", color: "var(--color-muted, #94a3b8)" }}>{label}</p>
    </div>
  );
}

export default function Reports() {
  return <AuthProvider><ReportsPage /></AuthProvider>;
}
