"use client";

import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";

export interface ImpactSimulation {
  factorId: string;
  factorName: string;
  currentScore: number | null;
  estimatedScore: number | null;
  expectedGain: number | null;
  level: "critical" | "needs_attention" | "good" | "excellent" | "pending";
  basis: string;
}

export function ImpactSimulator({ impacts }: { impacts: ImpactSimulation[] }) {
  if (impacts.length === 0) {
    return (
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
        <p style={{ ...typography.small, margin: 0, color: colors.muted }}>No impact estimates available.</p>
      </div>
    );
  }

  // Sort by expected gain descending (biggest opportunity first), pending last
  const sorted = [...impacts].sort((a, b) => {
    if (a.expectedGain === null) return 1;
    if (b.expectedGain === null) return -1;
    return (b.expectedGain ?? 0) - (a.expectedGain ?? 0);
  });

  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}` }}>Impact Simulation</h3>
      <p style={{ ...typography.caption, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>
        Estimated score gain if you follow each factor's recommended actions.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        {sorted.map((s) => (
          <div key={s.factorId} style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>{s.factorName}</p>
              {s.expectedGain !== null ? (
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: "0.6875rem", fontWeight: 600, background: `${colors.success}20`, color: colors.success }}>
                  +{s.expectedGain} gain
                </span>
              ) : (
                <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: "0.6875rem", fontWeight: 600, background: colors.border, color: colors.mutedDarker }}>Pending</span>
              )}
            </div>
            {s.currentScore !== null && s.estimatedScore !== null ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginBottom: spacing.xs }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 700, color: scoreColor(s.currentScore) }}>{s.currentScore}</span>
                  <span style={{ color: colors.muted }}>→</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: 700, color: colors.success }}>{s.estimatedScore}</span>
                </div>
                {/* Delta bar */}
                <div style={{ display: "flex", height: 6, borderRadius: radius.sm, overflow: "hidden" }}>
                  <div style={{ width: `${s.currentScore}%`, background: scoreColor(s.currentScore) }} />
                  <div style={{ width: `${Math.max(0, s.expectedGain ?? 0)}%`, background: colors.success }} />
                </div>
              </>
            ) : (
              <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: "italic" }}>{s.basis}</p>
            )}
            <p style={{ ...typography.caption, margin: `${spacing.sm} 0 0`, color: colors.mutedDarker }}>{s.basis}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
