"use client";

import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";

export interface SnapshotPoint {
  capturedAt: string;
  overallScore: number | null;
  overallStatus: string | null;
  categoryScores: Record<string, number | null>;
  liveFactors: number;
  pendingFactors: number;
}

export interface SnapshotHistory {
  restaurantId: string;
  range: "7d" | "30d" | "90d" | "all";
  points: SnapshotPoint[];
}

// ── Sparkline / line chart for overall or category trends ──
export function TrendChart({
  points,
  height = 64,
  width = 220,
}: {
  points: { value: number | null; capturedAt: string }[];
  height?: number;
  width?: number;
}) {
  const values = points
    .map((p) => p.value)
    .filter((v): v is number => v !== null);

  if (values.length < 2) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...typography.caption, color: colors.mutedDarker }}>Not enough data yet</span>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;

  const coords = values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, values.length - 1);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const lastColor = scoreColor(values[values.length - 1]);
  const lastPoint = coords[coords.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Score trend">
      <path d={path} fill="none" stroke={lastColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={lastColor} />
    </svg>
  );
}

// ── Trend section with range selector ──
export function TrendSection({
  history,
  title = "Historical Trend",
  points,
  onRange,
}: {
  history?: SnapshotHistory | null;
  title?: string;
  points?: { value: number | null; capturedAt: string }[];
  onRange?: (range: "7d" | "30d" | "90d" | "all") => void;
}) {
  const data = points || (history ? history.points.map((p) => ({ value: p.overallScore, capturedAt: p.capturedAt })) : []);
  const current = data.filter((d) => d.value !== null).length > 0 ? data.filter((d) => d.value !== null)[data.filter((d) => d.value !== null).length - 1].value : null;
  const first = data.filter((d) => d.value !== null).length > 0 ? data.filter((d) => d.value !== null)[0].value : null;
  const change = current !== null && first !== null ? current - first : null;

  const ranges: ("7d" | "30d" | "90d" | "all")[] = ["7d", "30d", "90d", "all"];

  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
        <div>
          <h3 style={{ ...typography.h3, margin: 0 }}>{title}</h3>
          {change !== null && (
            <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: change > 0 ? colors.success : change < 0 ? colors.danger : colors.muted }}>
              {change > 0 ? `↑ +${change}` : change < 0 ? `↓ ${change}` : "→ stable"} over this period
            </p>
          )}
        </div>
        {onRange && (
          <div style={{ display: "flex", gap: spacing.xs }}>
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => onRange(r)}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: radius.sm,
                  border: `1px solid ${colors.border}`,
                  background: "transparent",
                  color: colors.muted,
                  cursor: "pointer",
                  fontSize: "0.625rem",
                }}
              >
                {r === "all" ? "All" : r.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
      <TrendChart points={data} />
    </div>
  );
}
