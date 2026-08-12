"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

interface WeeklyChange {
  factorId: string;
  factorName: string;
  delta: number;
  fromScore: number | null;
  toScore: number | null;
}

interface WeeklyAction {
  factorId: string;
  factorName: string;
  score: number | null;
  status: string;
  recommendedAction: string;
  expectedImprovement: string;
}

interface WeeklyIntelligenceReport {
  restaurantId: string;
  restaurantName: string;
  period: { start: string; end: string };
  overallScore: number | null;
  overallStatus: string | null;
  changed: WeeklyChange[];
  improved: WeeklyChange[];
  worsened: WeeklyChange[];
  actions: WeeklyAction[];
  newDecisions: number;
  sourceUpdates: number;
  generatedAt: string;
}

function WeeklyIntelligencePage() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<WeeklyIntelligenceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchRestaurants = async () => {
    if (!token) return;
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
      setRestaurants(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (id: string) => {
    setReportLoading(true);
    setSelectedId(id);
    try {
      const res = await fetch(`${API}/api/restaurants/${id}/weekly-intelligence`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setReport(d.data); }
    } catch {} finally { setReportLoading(false); }
  };

  useEffect(() => { fetchRestaurants(); }, [token]);

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><LoadingSkeleton count={4} height="4rem" width="100%" /></div>;

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load</p>
          <button onClick={fetchRestaurants} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Weekly Intelligence</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.muted }}>What changed · What improved · What worsened · What to do next</p>

      {restaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>📊</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No restaurants yet</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Add a restaurant and run an analysis to generate weekly intelligence.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {restaurants.map((r) => (
            <div key={r.id}>
              <button onClick={() => fetchReport(r.id)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, background: selectedId === r.id ? colors.primaryLight : colors.surface, borderRadius: radius.lg, border: selectedId === r.id ? `1px solid ${colors.primary}40` : `1px solid ${colors.border}`, cursor: "pointer", textAlign: "left", color: "inherit", fontSize: "inherit", fontFamily: "inherit" }}>
                <div>
                  <p style={{ ...typography.body, margin: 0, fontWeight: 500 }}>{r.name}</p>
                  <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{r.city}</p>
                </div>
                <span style={{ color: colors.muted, fontSize: "0.875rem" }}>→</span>
              </button>

              {selectedId === r.id && (
                <div style={{ marginTop: spacing.md, padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
                  {reportLoading ? (
                    <LoadingSkeleton count={4} height="2rem" width="100%" />
                  ) : report ? (
                    <div>
                      {/* Period + overall */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
                        <p style={{ ...typography.caption, margin: 0 }}>
                          {new Date(report.period.start).toLocaleDateString()} — {new Date(report.period.end).toLocaleDateString()}
                        </p>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: report.overallScore !== null && report.overallScore >= 60 ? colors.success : report.overallScore !== null && report.overallScore >= 40 ? colors.warning : colors.danger }}>
                            {report.overallScore ?? "—"}
                          </p>
                          <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>{report.overallStatus?.replace(/_/g, " ")}</p>
                        </div>
                      </div>

                      {/* What changed? */}
                      <Section title="What changed?">
                        {report.changed.length === 0 ? <Empty>No score changes this week.</Empty> : (
                          report.changed.map((c) => (
                            <ChangeRow key={c.factorId} c={c} />
                          ))
                        )}
                        <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.md, flexWrap: "wrap" }}>
                          <Pill color={colors.primary}>{report.newDecisions} new decisions</Pill>
                          <Pill color={colors.warning}>{report.sourceUpdates} source updates</Pill>
                        </div>
                      </Section>

                      {/* What improved? */}
                      <Section title="What improved?">
                        {report.improved.length === 0 ? <Empty>Nothing improved this week — yet.</Empty> : (
                          report.improved.map((c) => <ChangeRow key={c.factorId} c={c} positive />)
                        )}
                      </Section>

                      {/* What worsened? */}
                      <Section title="What worsened?">
                        {report.worsened.length === 0 ? <Empty>Nothing worsened this week. Great!</Empty> : (
                          report.worsened.map((c) => <ChangeRow key={c.factorId} c={c} negative />)
                        )}
                      </Section>

                      {/* What should I do next? */}
                      <Section title="What should I do next?">
                        {report.actions.length === 0 ? <Empty>No action items. Your scorecard is healthy.</Empty> : (
                          report.actions.map((a) => (
                            <div key={a.factorId} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: spacing.md, background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}`, marginBottom: spacing.sm }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>{a.factorName}</p>
                                <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{a.recommendedAction}</p>
                              </div>
                              <div style={{ textAlign: "right", marginLeft: spacing.md }}>
                                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: a.score !== null && a.score < 40 ? colors.danger : colors.warning }}>{a.score ?? "—"}</p>
                                <p style={{ ...typography.caption, margin: 0, color: colors.success }}>{a.expectedImprovement}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </Section>
                    </div>
                  ) : (
                    <p style={{ ...typography.small, margin: 0, color: colors.muted }}>No data yet. Run an analysis to generate weekly intelligence.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: spacing.xl }}>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ ...typography.small, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker, fontStyle: "italic" }}>{children}</p>;
}

function ChangeRow({ c, positive, negative }: { c: WeeklyChange; positive?: boolean; negative?: boolean }) {
  const color = positive ? colors.success : negative ? colors.danger : c.delta > 0 ? colors.success : colors.danger;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.sm, background: colors.bg, borderRadius: radius.sm, border: `1px solid ${colors.border}`, marginBottom: spacing.xs }}>
      <p style={{ margin: 0, fontSize: "0.8125rem", color: colors.text }}>{c.factorName}</p>
      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color }}>
        {c.delta > 0 ? `+${c.delta}` : c.delta} ({c.fromScore ?? "—"} → {c.toScore ?? "—"})
      </span>
    </div>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.6875rem", fontWeight: 600, background: `${color}20`, color }}>
      {children}
    </span>
  );
}

export default function WeeklyReport() {
  return <AuthProvider><WeeklyIntelligencePage /></AuthProvider>;
}
