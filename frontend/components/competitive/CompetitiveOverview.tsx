"use client";

import type { CompetitorData, BenchmarkData, CompetitiveInsightData } from "@/app/lib/discovery";

function severityColor(severity: string): string {
  const map: Record<string, string> = {
    positive: "var(--color-success, #22c55e)",
    neutral: "var(--color-muted, #6b7280)",
    warning: "var(--color-warning, #f59e0b)",
    critical: "var(--color-danger, #ef4444)",
  };
  return map[severity] ?? map.neutral;
}

function insightIcon(type: string): string {
  const map: Record<string, string> = {
    strength: "🟢",
    weakness: "🔴",
    opportunity: "🟡",
    threat: "⚠️",
  };
  return map[type] ?? "•";
}

interface CompetitiveOverviewProps {
  competitors: CompetitorData[];
  benchmarks: BenchmarkData[];
  insights: CompetitiveInsightData[];
  competitorCount: number;
}

export function CompetitiveOverview({
  competitors,
  benchmarks,
  insights,
  competitorCount,
}: CompetitiveOverviewProps) {
  const strengths = insights.filter((i) => i.type === "strength");
  const weaknesses = insights.filter((i) => i.type === "weakness");
  const opportunities = insights.filter((i) => i.type === "opportunity");
  const threats = insights.filter((i) => i.type === "threat");

  return (
    <div className="competitive-overview" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.25rem",
          background: "var(--color-surface, #1e293b)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border, #334155)",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
            Competitive Landscape
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>
            {competitorCount} competitor{competitorCount !== 1 ? "s" : ""} identified
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
            {insights.length} insights
          </span>
        </div>
      </div>

      {/* Insight Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <SummaryCard label="Strengths" count={strengths.length} color="var(--color-success, #22c55e)" />
        <SummaryCard label="Weaknesses" count={weaknesses.length} color="var(--color-danger, #ef4444)" />
        <SummaryCard label="Opportunities" count={opportunities.length} color="var(--color-warning, #f59e0b)" />
        <SummaryCard label="Threats" count={threats.length} color="var(--color-warning, #f59e0b)" />
      </div>

      {/* Competitor List */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--color-surface, #1e293b)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border, #334155)",
        }}
      >
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
          Competitors
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {competitors.map((c, i) => (
            <CompetitorRow key={i} competitor={c} rank={i + 1} />
          ))}
          {competitors.length === 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>
              No competitors found within the configured radius.
            </p>
          )}
        </div>
      </div>

      {/* Benchmark Table */}
      {benchmarks.length > 0 && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "var(--color-surface, #1e293b)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border, #334155)",
          }}
        >
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
            Score Benchmarks
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border, #334155)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.5rem", color: "var(--color-muted, #94a3b8)", fontWeight: 500 }}>Dimension</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.5rem", color: "var(--color-muted, #94a3b8)", fontWeight: 500 }}>You</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.5rem", color: "var(--color-muted, #94a3b8)", fontWeight: 500 }}>Avg</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.5rem", color: "var(--color-muted, #94a3b8)", fontWeight: 500 }}>Median</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.5rem", color: "var(--color-muted, #94a3b8)", fontWeight: 500 }}>Min</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.5rem", color: "var(--color-muted, #94a3b8)", fontWeight: 500 }}>Max</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.5rem", color: "var(--color-muted, #94a3b8)", fontWeight: 500 }}>%ile</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((b, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < benchmarks.length - 1 ? "1px solid var(--color-border, #334155)" : "none",
                    }}
                  >
                    <td style={{ padding: "0.5rem 0.5rem", color: "var(--color-text, #f1f5f9)" }}>
                      {formatDimensionName(b.dimension)}
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", textAlign: "right", fontWeight: 600, color: b.focalScore >= b.average ? "var(--color-success, #22c55e)" : "var(--color-danger, #ef4444)" }}>
                      {b.focalScore}
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", textAlign: "right", color: "var(--color-text, #f1f5f9)" }}>
                      {b.average}
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", textAlign: "right", color: "var(--color-text, #f1f5f9)" }}>
                      {b.median}
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", textAlign: "right", color: "var(--color-muted, #94a3b8)" }}>
                      {b.min}
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", textAlign: "right", color: "var(--color-muted, #94a3b8)" }}>
                      {b.max}
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", textAlign: "right", color: "var(--color-text, #f1f5f9)" }}>
                      {b.focalPercentile}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights List */}
      {insights.length > 0 && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "var(--color-surface, #1e293b)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border, #334155)",
          }}
        >
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
            Insights
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {insights.map((insight, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  background: "var(--color-bg, #0f172a)",
                  borderRadius: "0.5rem",
                  borderLeft: `3px solid ${severityColor(insight.severity)}`,
                }}
              >
                <span style={{ fontSize: "1rem", lineHeight: 1.4 }}>{insightIcon(insight.type)}</span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text, #f1f5f9)" }}>
                    {insight.description}
                  </p>
                  <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
                    {insight.type} · {formatDimensionName(insight.dimension)} · gap: {insight.gapSize > 0 ? "+" : ""}{insight.gapSize}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        background: "var(--color-surface, #1e293b)",
        borderRadius: "0.5rem",
        border: "1px solid var(--color-border, #334155)",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>
        {count}
      </p>
    </div>
  );
}

function CompetitorRow({ competitor, rank }: { competitor: CompetitorData; rank: number }) {
  const topGap = competitor.scoreGaps
    .filter((g) => g.gap < 0)
    .sort((a, b) => a.gap - b.gap)[0];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.5rem 0.75rem",
        background: "var(--color-bg, #0f172a)",
        borderRadius: "0.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", fontWeight: 500, minWidth: "1.25rem" }}>
          #{rank}
        </span>
        <div>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text, #f1f5f9)" }}>
            {competitor.name}
          </p>
          <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
            {competitor.distance.toFixed(1)} mi · similarity: {competitor.overallScore}%
            {competitor.priceTierMatch ? " · same price tier" : ""}
          </p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
          {competitor.overallScore}
        </p>
        {topGap && (
          <p style={{ margin: "0.125rem 0 0", fontSize: "0.6875rem", color: "var(--color-danger, #ef4444)" }}>
            behind by {Math.abs(topGap.gap)} in {formatDimensionName(topGap.dimension)}
          </p>
        )}
      </div>
    </div>
  );
}

function formatDimensionName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/Score$/, "")
    .trim();
}
