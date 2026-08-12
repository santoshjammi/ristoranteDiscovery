"use client";

import Link from "next/link";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";

export interface PrioritizedRestaurant {
  id: string;
  name: string;
  city: string;
  overallScore: number | null;
  overallStatus: string | null;
  criticalAlerts: number;
  pendingActions: number;
  urgencyScore: number;
  opportunityScore: number;
  weakestFactor: { factorId: string; name: string; score: number | null } | null;
  topGain: { factorId: string; name: string; expectedGain: number | null } | null;
  rank: number;
}

export interface PrioritizedPortfolio {
  restaurants: PrioritizedRestaurant[];
  sortedBy: "urgency" | "opportunity" | "weakest";
  generatedAt: string;
}

export type SortKey = "urgency" | "opportunity" | "weakest";

export function PrioritizationView({ portfolio, onSort }: { portfolio: PrioritizedPortfolio; onSort: (k: SortKey) => void }) {
  const sortKeys: { key: SortKey; label: string }[] = [
    { key: "urgency", label: "Urgency" },
    { key: "opportunity", label: "Opportunity" },
    { key: "weakest", label: "Weakest" },
  ];

  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg, flexWrap: "wrap", gap: spacing.md }}>
        <div>
          <h3 style={{ ...typography.h3, margin: 0 }}>Portfolio Prioritization</h3>
          <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Ranked by {portfolio.sortedBy}</p>
        </div>
        <div style={{ display: "flex", gap: spacing.xs }}>
          {sortKeys.map((s) => (
            <button
              key={s.key}
              onClick={() => onSort(s.key)}
              style={{
                padding: `${spacing.xs} ${spacing.md}`,
                borderRadius: radius.sm,
                border: `1px solid ${portfolio.sortedBy === s.key ? colors.primary : colors.border}`,
                background: portfolio.sortedBy === s.key ? colors.primaryLight : "transparent",
                color: portfolio.sortedBy === s.key ? colors.primary : colors.muted,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        {portfolio.restaurants.slice(0, 20).map((r) => (
          <Link key={r.id} href={`/dashboard/restaurants/${r.id}`} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.md, padding: spacing.md, background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}`, marginBottom: spacing.xs }}>
              <div style={{ display: "flex", alignItems: "center", gap: spacing.md, flex: 1 }}>
                <span style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: radius.full, background: colors.primaryLight, color: colors.primary, fontSize: "0.75rem", fontWeight: 700 }}>{r.rank}</span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>{r.name}</p>
                  <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
                    {r.city}{r.weakestFactor ? ` · Weakest: ${r.weakestFactor.name} (${r.weakestFactor.score ?? "—"})` : ""}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: r.overallScore !== null ? scoreColor(r.overallScore) : colors.mutedDarker }}>{r.overallScore ?? "—"}</p>
                {r.topGain && r.topGain.expectedGain !== null && (
                  <p style={{ ...typography.caption, margin: 0, color: colors.success }}>+{r.topGain.expectedGain} opportunity</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
