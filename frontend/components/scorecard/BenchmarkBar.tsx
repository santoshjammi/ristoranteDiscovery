"use client";

import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";

export type BenchmarkDimension = "city" | "cuisine" | "price" | "competitors";

export interface BenchmarkResult {
  factorId: string;
  dimension: BenchmarkDimension;
  dimensionValue: string;
  score: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  count: number;
}

const DIMENSION_LABELS: Record<BenchmarkDimension, string> = {
  city: "City",
  cuisine: "Cuisine",
  price: "Price Tier",
  competitors: "Competitors",
};

// ── "Compared to" bar for a single factor ──
export function BenchmarkBar({ benchmark }: { benchmark: BenchmarkResult }) {
  if (benchmark.score === null || benchmark.p50 === null) {
    return (
      <div style={{ padding: spacing.sm, background: colors.bg, borderRadius: radius.sm }}>
        <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>
          {DIMENSION_LABELS[benchmark.dimension]}: not enough peers yet
        </p>
      </div>
    );
  }

  const score = benchmark.score;
  const p50 = benchmark.p50;
  const above = score >= p50;
  const diff = score - p50;

  return (
    <div style={{ padding: spacing.sm, background: colors.bg, borderRadius: radius.sm }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs }}>
        <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, color: colors.mutedDarker }}>
          {DIMENSION_LABELS[benchmark.dimension]} · {benchmark.dimensionValue}
        </p>
        <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, color: above ? colors.success : colors.danger }}>
          {above ? "▲" : "▼"} {above ? "above" : "below"} peer median
        </p>
      </div>
      {/* Bar showing score vs p50 */}
      <div style={{ position: "relative", height: 8, background: colors.border, borderRadius: radius.sm }}>
        {/* median marker */}
        <div style={{ position: "absolute", left: `${p50}%`, top: -2, bottom: -2, width: 2, background: colors.muted, zIndex: 1 }} title={`Peer median ${p50}`} />
        <div style={{ width: `${score}%`, height: "100%", background: scoreColor(score), borderRadius: radius.sm }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: spacing.xs }}>
        <span style={{ ...typography.caption, color: colors.muted }}>{score}</span>
        <span style={{ ...typography.caption, color: colors.muted }}>median {p50}</span>
        <span style={{ ...typography.caption, color: colors.mutedDarker }}>p75 {benchmark.p75 ?? "—"} · p90 {benchmark.p90 ?? "—"}</span>
      </div>
    </div>
  );
}
