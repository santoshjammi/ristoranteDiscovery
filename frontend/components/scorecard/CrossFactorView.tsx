"use client";

import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";

export interface InfluenceLink {
  factorId: string;
  factorName: string;
  score: number | null;
  status: string;
  weak: boolean;
}

export interface FactorInfluence {
  factorId: string;
  factorName: string;
  score: number | null;
  status: string;
  influenceOn: InfluenceLink[];
  influencedBy: InfluenceLink[];
}

export interface CrossFactorReport {
  restaurantId: string;
  factors: FactorInfluence[];
  chains: string[][];
  generatedAt: string;
}

export function CrossFactorView({ report }: { report: CrossFactorReport }) {
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}` }}>Cross-Factor Relationships</h3>
      <p style={{ ...typography.caption, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>
        Deterministic influence map — which weak factors affect others.
      </p>

      {/* Weak chains */}
      {report.chains.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <p style={{ ...typography.label, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker, fontSize: "0.75rem", fontWeight: 700 }}>Influence Chains (weak → downstream)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {report.chains.slice(0, 8).map((chain, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: spacing.sm, flexWrap: "wrap", padding: spacing.sm, background: colors.bg, borderRadius: radius.sm }}>
                {chain.map((name, j) => (
                  <span key={j} style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                    <span style={{ fontSize: "0.75rem", color: colors.warning, fontWeight: 600 }}>{name}</span>
                    {j < chain.length - 1 && <span style={{ color: colors.muted }}>→</span>}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Factor influence list */}
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {report.factors.map((f) => (
            <div key={f.factorId} style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>{f.factorName}</p>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: f.score !== null ? scoreColor(f.score) : colors.mutedDarker }}>{f.score ?? "—"}</span>
              </div>
              {f.influencedBy.length > 0 && (
                <p style={{ ...typography.caption, margin: `${spacing.xs} 0`, color: colors.mutedDarker }}>
                  <span style={{ color: colors.muted }}>Influenced by:</span>{" "}
                  {f.influencedBy.map((u) => (
                    <span key={u.factorId} style={{ color: u.weak ? colors.warning : colors.text, fontWeight: u.weak ? 600 : 400 }}>{u.factorName} </span>
                  ))}
                </p>
              )}
              {f.influenceOn.length > 0 && (
                <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
                  <span style={{ color: colors.muted }}>Influences:</span>{" "}
                  {f.influenceOn.map((d) => (
                    <span key={d.factorId} style={{ color: d.weak ? colors.warning : colors.text, fontWeight: d.weak ? 600 : 400 }}>{d.factorName} </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
