"use client";

import type { MarketAreaData, MarketInsightData, MarketTrendData } from "@/app/lib/discovery";

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
    saturation: "📊",
    gap: "🔍",
    trend: "📈",
    benchmark: "📏",
  };
  return map[type] ?? "•";
}

interface MarketOverviewProps {
  areas: MarketAreaData[];
  insights: MarketInsightData[];
  trends: MarketTrendData[];
}

export function MarketOverview({ areas, insights, trends }: MarketOverviewProps) {
  return (
    <div className="market-overview" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
            Market Intelligence
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>
            {areas.length} area{areas.length !== 1 ? "s" : ""} · {insights.length} insight{insights.length !== 1 ? "s" : ""} · {trends.length} trend{trends.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Area Cards */}
      {areas.map((area, i) => (
        <div
          key={i}
          style={{
            padding: "1rem 1.25rem",
            background: "var(--color-surface, #1e293b)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border, #334155)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
              {area.name}
            </h4>
            <span style={{ fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
              {area.restaurantCount} restaurants · {area.totalReviews} reviews · ⭐ {area.averageRating.toFixed(1)}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {/* Cuisine Distribution */}
            <div>
              <p style={{ margin: "0 0 0.375rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Cuisine Distribution
              </p>
              {area.topCuisines.map((c, j) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "0.125rem 0", fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--color-text, #f1f5f9)" }}>{c.cuisine}</span>
                  <span style={{ color: "var(--color-muted, #94a3b8)" }}>{c.count}</span>
                </div>
              ))}
            </div>

            {/* Price Distribution */}
            <div>
              <p style={{ margin: "0 0 0.375rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Price Distribution
              </p>
              {Object.entries(area.priceDistribution).map(([tier, count], j) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "0.125rem 0", fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--color-text, #f1f5f9)" }}>{tier}</span>
                  <span style={{ color: "var(--color-muted, #94a3b8)" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Insights */}
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
            Market Insights
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
                    {insight.type} · {insight.area}{insight.cuisine ? ` · ${insight.cuisine}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends */}
      {trends.length > 0 && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "var(--color-surface, #1e293b)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border, #334155)",
          }}
        >
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
            Observed Review Activity
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {trends.map((trend, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0.75rem",
                  background: "var(--color-bg, #0f172a)",
                  borderRadius: "0.5rem",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text, #f1f5f9)" }}>
                    {trend.cuisine} in {trend.area}
                  </p>
                  <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
                    {trend.reviewVolume} reviews · ⭐ {trend.averageRating.toFixed(1)}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.125rem 0.5rem",
                    borderRadius: "0.25rem",
                    background:
                      trend.sentimentTrend === "improving"
                        ? "rgba(34, 197, 94, 0.15)"
                        : trend.sentimentTrend === "declining"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(107, 114, 128, 0.15)",
                    color:
                      trend.sentimentTrend === "improving"
                        ? "var(--color-success, #22c55e)"
                        : trend.sentimentTrend === "declining"
                        ? "var(--color-danger, #ef4444)"
                        : "var(--color-muted, #6b7280)",
                  }}
                >
                  {trend.sentimentTrend}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
