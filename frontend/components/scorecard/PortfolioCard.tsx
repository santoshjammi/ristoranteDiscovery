"use client";

import Link from "next/link";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";

export type Trend = "up" | "down" | "stable" | "new" | null;

export interface PortfolioRestaurant {
  id: string;
  name: string;
  city: string;
  cuisineTypes: string[];
  priceRange: string | null;
  overallScore: number | null;
  overallStatus: string | null;
  categoryScores: Record<string, number | null>;
  topIssue: { factorId: string; name: string; score: number | null; status: string } | null;
  trend: Trend;
  lastScan: string | null;
  criticalAlerts: number;
  pendingActions: number;
  disabled: boolean;
}

export interface PortfolioSummary {
  total: number;
  active: number;
  disabled: number;
  averageScore: number | null;
  criticalCount: number;
  attentionCount: number;
  healthyCount: number;
  pendingCount: number;
}

export interface Portfolio {
  summary: PortfolioSummary;
  restaurants: PortfolioRestaurant[];
}

const CATEGORY_ORDER = ["discoverability", "reputation", "digital", "information", "market"];
const CATEGORY_LABELS: Record<string, string> = {
  discoverability: "Discover",
  reputation: "Reputation",
  digital: "Digital",
  information: "Info",
  market: "Market",
};

function trendIcon(trend: Trend): { glyph: string; color: string } {
  switch (trend) {
    case "up": return { glyph: "↑", color: colors.success };
    case "down": return { glyph: "↓", color: colors.danger };
    case "stable": return { glyph: "→", color: colors.muted };
    case "new": return { glyph: "NEW", color: colors.primary };
    default: return { glyph: "—", color: colors.mutedDarker };
  }
}

function formatLastScan(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function PortfolioCard({ restaurant }: { restaurant: PortfolioRestaurant }) {
  const score = restaurant.overallScore;
  const color = score !== null ? scoreColor(score) : colors.mutedDarker;
  const trend = trendIcon(restaurant.trend);
  const isDisabled = restaurant.disabled;

  return (
    <Link
      href={`/dashboard/restaurants/${restaurant.id}`}
      style={{
        display: "block",
        padding: spacing.xl,
        background: colors.surface,
        borderRadius: radius.lg,
        border: `1px solid ${isDisabled ? colors.dangerLight : colors.border}`,
        textDecoration: "none",
        opacity: isDisabled ? 0.6 : 1,
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDisabled ? colors.dangerLight : colors.border; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Header: name + overall score + trend */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: colors.text }}>{restaurant.name}</p>
            {isDisabled && <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.625rem", fontWeight: 600, background: colors.dangerLight, color: colors.danger }}>Disabled</span>}
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: trend.color }} title={`Trend: ${restaurant.trend}`}>{trend.glyph}</span>
          </div>
          <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "0.75rem", color: colors.mutedDarker }}>
            {restaurant.city}{restaurant.cuisineTypes.length > 0 ? ` · ${restaurant.cuisineTypes.join(", ")}` : ""}{restaurant.priceRange ? ` · ${restaurant.priceRange}` : ""}
          </p>
        </div>
        <div style={{ textAlign: "right", marginLeft: spacing.md }}>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700, lineHeight: 1, color }}>{score !== null ? score : "—"}</p>
          <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>/100</p>
        </div>
      </div>

      {/* 5 category mini-scores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: spacing.xs, marginBottom: spacing.md }}>
        {CATEGORY_ORDER.map((catId) => {
          const catScore = restaurant.categoryScores[catId];
          const catColor = catScore !== null ? scoreColor(catScore) : colors.mutedDarker;
          return (
            <div key={catId} style={{ textAlign: "center", padding: `${spacing.xs} ${spacing.xs}`, background: colors.bg, borderRadius: radius.sm }}>
              <p style={{ margin: 0, fontSize: "0.5625rem", color: colors.mutedDarker, textTransform: "uppercase", letterSpacing: "0.03em" }}>{CATEGORY_LABELS[catId] || catId}</p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "0.875rem", fontWeight: 700, color: catColor }}>{catScore !== null ? catScore : "—"}</p>
            </div>
          );
        })}
      </div>

      {/* Top issue + alerts + pending + last scan */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.md, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          {restaurant.topIssue ? (
            <>
              <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>Top issue</p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "0.75rem", fontWeight: 600, color: restaurant.topIssue.status === "critical" ? colors.danger : colors.warning }}>
                {restaurant.topIssue.name} · {restaurant.topIssue.score}
              </p>
            </>
          ) : (
            <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>No live factors yet</p>
          )}
        </div>
        <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
          {restaurant.criticalAlerts > 0 && (
            <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.625rem", fontWeight: 600, background: colors.dangerLight, color: colors.danger }}>
              {restaurant.criticalAlerts} critical
            </span>
          )}
          {restaurant.pendingActions > 0 && (
            <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.625rem", fontWeight: 600, background: colors.border, color: colors.mutedDarker }}>
              {restaurant.pendingActions} pending
            </span>
          )}
          <span style={{ ...typography.caption, color: colors.mutedDarker }}>Scan {formatLastScan(restaurant.lastScan)}</span>
        </div>
      </div>
    </Link>
  );
}

export function PortfolioSummaryBar({ summary }: { summary: PortfolioSummary }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: spacing.md, marginBottom: spacing.xl }}>
      <div style={{ padding: spacing.lg, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: summary.averageScore !== null ? scoreColor(summary.averageScore) : colors.mutedDarker }}>{summary.averageScore !== null ? summary.averageScore : "—"}</p>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Avg Score</p>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Score:</p>
      </div>
      <div style={{ padding: spacing.lg, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: colors.text }}>{summary.total}</p>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>total</p>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Active</p>
      </div>
      <div style={{ padding: spacing.lg, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: colors.danger }}>{summary.criticalCount}</p>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Critical</p>
      </div>
      <div style={{ padding: spacing.lg, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: colors.warning }}>{summary.attentionCount}</p>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>need attention</p>
      </div>
      <div style={{ padding: spacing.lg, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: colors.success }}>{summary.healthyCount}</p>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Healthy</p>
      </div>
      <div style={{ padding: spacing.lg, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: colors.mutedDarker }}>{summary.pendingCount}</p>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Pending</p>
      </div>
    </div>
  );
}
