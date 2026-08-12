"use client";

import Link from "next/link";
import { colors, spacing, radius, typography, scoreColor } from "@/lib/design-tokens";
import type { PortfolioRestaurant } from "./PortfolioCard";

const CATEGORY_ORDER = ["discoverability", "reputation", "digital", "information", "market"];
const CATEGORY_LABELS: Record<string, string> = {
  discoverability: "Discoverability",
  reputation: "Reputation",
  digital: "Digital Experience",
  information: "Info",
  market: "Market",
};

function cellColor(score: number | null): string {
  if (score === null) return colors.border;
  if (score >= 80) return "rgba(34, 197, 94, 0.85)";
  if (score >= 70) return "rgba(34, 197, 94, 0.6)";
  if (score >= 60) return "rgba(245, 158, 11, 0.7)";
  if (score >= 40) return "rgba(245, 158, 11, 0.5)";
  if (score >= 20) return "rgba(239, 68, 68, 0.6)";
  return "rgba(239, 68, 68, 0.85)";
}

export type HeatFilter = "all" | "critical" | "attention" | "healthy";

export function PortfolioHeatMap({ restaurants, filter = "all" }: { restaurants: PortfolioRestaurant[]; filter?: HeatFilter }) {
  // Sort by weakest overall score ascending (worst first)
  const sorted = [...restaurants].sort((a, b) => (a.overallScore ?? 999) - (b.overallScore ?? 999));

  const applyFilter = (r: PortfolioRestaurant): boolean => {
    if (filter === "all") return true;
    const s = r.overallScore;
    if (s === null) return false;
    if (filter === "critical") return s < 40;
    if (filter === "attention") return s >= 40 && s < 70;
    return s >= 70;
  };

  const visible = sorted.filter(applyFilter);

  if (visible.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: spacing["3xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
        <p style={{ ...typography.small, margin: 0, color: colors.muted }}>No restaurants match this filter.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: spacing.sm, color: colors.mutedDarker, fontSize: "0.6875rem", fontWeight: 600 }}>Restaurant</th>
            {CATEGORY_ORDER.map((catId) => (
              <th key={catId} style={{ textAlign: "center", padding: spacing.sm, color: colors.mutedDarker, fontSize: "0.6875rem", fontWeight: 600 }}>
                {CATEGORY_LABELS[catId] || catId}
              </th>
            ))}
            <th style={{ textAlign: "center", padding: spacing.sm, color: colors.mutedDarker, fontSize: "0.6875rem", fontWeight: 600 }}>Overall</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.id} style={{ borderTop: `1px solid ${colors.border}` }}>
              <td style={{ padding: spacing.sm }}>
                <Link href={`/dashboard/restaurants/${r.id}`} style={{ textDecoration: "none", color: colors.text, fontWeight: 600, fontSize: "0.8125rem" }}>
                  {r.name}
                </Link>
                <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{r.city}</p>
              </td>
              {CATEGORY_ORDER.map((catId) => {
                const catScore = r.categoryScores[catId];
                return (
                  <td key={catId} style={{ textAlign: "center", padding: spacing.xs }}>
                    <div
                      style={{
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: cellColor(catScore),
                        color: catScore !== null && catScore >= 60 ? "#0f172a" : "#f8fafc",
                        borderRadius: radius.sm,
                        fontWeight: 700,
                        fontSize: "0.8125rem",
                      }}
                    >
                      {catScore !== null ? catScore : "—"}
                    </div>
                  </td>
                );
              })}
              <td style={{ textAlign: "center", padding: spacing.xs }}>
                <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: colors.surface, borderRadius: radius.sm, fontWeight: 700, fontSize: "0.875rem", color: r.overallScore !== null ? scoreColor(r.overallScore) : colors.mutedDarker, border: `1px solid ${colors.border}` }}>
                  {r.overallScore !== null ? r.overallScore : "—"}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
