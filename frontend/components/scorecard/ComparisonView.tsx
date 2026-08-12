"use client";

import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";

export interface ComparisonFactor {
  factorId: string;
  factorName: string;
  focalScore: number | null;
  competitorScores: Record<string, number | null>;
  focalWins: number;
  focalLoses: number;
  advantage: "win" | "lose" | "tie" | "pending";
}

export interface ComparisonCategory {
  categoryId: string;
  categoryName: string;
  focalScore: number | null;
  competitorScores: Record<string, number | null>;
}

export interface RestaurantComparison {
  focalId: string;
  focalName: string;
  competitors: { id: string; name: string; overallScore: number | null }[];
  categories: ComparisonCategory[];
  factors: ComparisonFactor[];
  overallAdvantage: "win" | "lose" | "tie";
  generatedAt: string;
}

function advantageColor(a: string): string {
  if (a === "win") return colors.success;
  if (a === "lose") return colors.danger;
  if (a === "tie") return colors.warning;
  return colors.mutedDarker;
}

export function ComparisonView({ comparison }: { comparison: RestaurantComparison }) {
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
        <h3 style={{ ...typography.h3, margin: 0 }}>Competitive Comparison</h3>
        <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${advantageColor(comparison.overallAdvantage)}20`, color: advantageColor(comparison.overallAdvantage) }}>
          Overall: {comparison.overallAdvantage === "win" ? "Leading" : comparison.overallAdvantage === "lose" ? "Trailing" : "Even"}
        </span>
      </div>

      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: spacing.sm, marginBottom: spacing.md }}>
        <div style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md, textAlign: "center" }}>
          <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>{comparison.focalName}</p>
          <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "1.25rem", fontWeight: 700, color: colors.text }}>Score</p>
        </div>
        {comparison.competitors.map((c) => (
          <div key={c.id} style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md, textAlign: "center" }}>
            <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>{c.name}</p>
            <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "1.25rem", fontWeight: 700, color: c.overallScore !== null ? scoreColor(c.overallScore) : colors.mutedDarker }}>{c.overallScore ?? "—"}</p>
          </div>
        ))}
      </div>

      {/* Factor comparison table */}
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: colors.surface }}>
            <tr>
              <th style={{ textAlign: "left", padding: spacing.sm, color: colors.mutedDarker, fontSize: "0.6875rem", fontWeight: 600 }}>Factor</th>
              <th style={{ textAlign: "center", padding: spacing.sm, color: colors.mutedDarker, fontSize: "0.6875rem", fontWeight: 600 }}>{comparison.focalName}</th>
              {comparison.competitors.map((c) => (
                <th key={c.id} style={{ textAlign: "center", padding: spacing.sm, color: colors.mutedDarker, fontSize: "0.6875rem", fontWeight: 600 }}>{c.name}</th>
              ))}
              <th style={{ textAlign: "center", padding: spacing.sm, color: colors.mutedDarker, fontSize: "0.6875rem", fontWeight: 600 }}>Edge</th>
            </tr>
          </thead>
          <tbody>
            {comparison.factors.map((f) => (
              <tr key={f.factorId} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: spacing.sm, fontSize: "0.75rem", color: colors.text }}>{f.factorName}</td>
                <td style={{ textAlign: "center", padding: spacing.sm, fontSize: "0.75rem", fontWeight: 700, color: f.focalScore !== null ? scoreColor(f.focalScore) : colors.mutedDarker }}>{f.focalScore ?? "—"}</td>
                {comparison.competitors.map((c) => (
                  <td key={c.id} style={{ textAlign: "center", padding: spacing.sm, fontSize: "0.75rem", color: f.competitorScores[c.id] !== null ? scoreColor(f.competitorScores[c.id]!) : colors.mutedDarker }}>
                    {f.competitorScores[c.id] ?? "—"}
                  </td>
                ))}
                <td style={{ textAlign: "center", padding: spacing.sm, fontSize: "0.75rem", fontWeight: 600, color: advantageColor(f.advantage) }}>
                  {f.advantage === "win" ? "▲" : f.advantage === "lose" ? "▼" : f.advantage === "tie" ? "=" : "·"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
