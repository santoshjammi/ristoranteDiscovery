"use client";

import { useState } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { scanRestaurant, type ScanResult, type ScanSource } from "@/app/lib/discovery";

// Category → human label + icon for grouping discovered sources.
const CATEGORY_LABEL: Record<string, { label: string; icon: string }> = {
  website: { label: "Website", icon: "🌐" },
  menu: { label: "Menu", icon: "🍽️" },
  listings_reviews: { label: "Listings & Reviews", icon: "⭐" },
  social: { label: "Social Profiles", icon: "📱" },
  google_business_profile: { label: "Google Business Profile", icon: "📍" },
  other: { label: "Other Public Sources", icon: "🔗" },
  pending: { label: "Not Yet Found", icon: "⏳" },
  noise: { label: "Excluded (Noise)", icon: "🚫" },
  unavailable: { label: "Unavailable", icon: "🚧" },
};

function categoryMeta(cat: string): { label: string; icon: string } {
  return CATEGORY_LABEL[cat] || { label: cat.replace(/_/g, " "), icon: "📌" };
}

function confidenceColor(confidence: number | null): string {
  if (confidence === null) return colors.mutedDarker;
  if (confidence >= 0.8) return colors.success;
  if (confidence >= 0.6) return colors.warning;
  return colors.danger;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function statusBadge(source: ScanSource): { text: string; color: string; bg: string } {
  switch (source.status) {
    case "real": return { text: "Real", color: colors.success, bg: colors.successLight };
    case "synthetic": return { text: "Synthetic", color: colors.danger, bg: colors.dangerLight };
    case "pending": return { text: "Pending", color: colors.mutedDarker, bg: "transparent" };
    case "noise": return { text: "Noise", color: colors.muted, bg: "transparent" };
    case "unavailable": return { text: "Unavailable", color: colors.muted, bg: "transparent" };
    default: return { text: source.status, color: colors.mutedDarker, bg: "transparent" };
  }
}

function SourceRow({ source }: { source: ScanSource }) {
  const [expanded, setExpanded] = useState(false);
  const badge = statusBadge(source);

  return (
    <div style={{ borderBottom: `1px solid ${colors.border}`, padding: `${spacing.md} 0` }}>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {source.sourceUrl ? (
            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: colors.primary, fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", wordBreak: "break-all" }}
            >
              {hostOf(source.sourceUrl)}
            </a>
          ) : (
            <span style={{ color: colors.mutedDarker, fontWeight: 500, fontSize: "0.875rem" }}>
              {source.sourceTypeLabel}
            </span>
          )}
          <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
            {source.sourceTypeLabel} · observed {formatDate(source.observedAt)}
          </p>
        </div>
        <span
          style={{
            padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.full, fontSize: "0.625rem", fontWeight: 700,
            background: badge.bg, color: badge.color, border: `1px solid ${source.status === "real" ? colors.success : "transparent"}`,
            flexShrink: 0,
          }}
        >
          {badge.text}
        </span>
      </div>
      {(source.confidence !== null || source.normalizedValue?.title) && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginLeft: spacing.xl, background: "none", border: "none", color: colors.muted,
            cursor: "pointer", fontSize: "0.75rem", padding: `${spacing.xs} 0`,
          }}
        >
          {expanded ? "▾ Hide details" : "▸ Show details"}
        </button>
      )}
      {expanded && (
        <div style={{ marginLeft: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.xs, fontSize: "0.8125rem" }}>
          <div style={{ display: "flex", gap: spacing.sm }}>
            <span style={{ color: colors.mutedDarker, minWidth: "6rem" }}>Confidence</span>
            <span style={{ color: confidenceColor(source.confidence) }}>
              {source.confidence === null ? "—" : `${Math.round(source.confidence * 100)}%`}
            </span>
          </div>
          {source.normalizedValue?.title && (
            <div style={{ display: "flex", gap: spacing.sm }}>
              <span style={{ color: colors.mutedDarker, minWidth: "6rem" }}>Page title</span>
              <span style={{ color: colors.text }}>{source.normalizedValue.title}</span>
            </div>
          )}
          {source.provenance && (
            <div style={{ display: "flex", gap: spacing.sm }}>
              <span style={{ color: colors.mutedDarker, minWidth: "6rem" }}>Discovered via</span>
              <span style={{ color: colors.text }}>{String((source.provenance as any).discoveredBy || "public-search")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DataScanPanelProps {
  restaurantId: string;
}

const CATEGORY_ORDER = [
  "website", "menu", "listings_reviews", "social", "google_business_profile", "other", "pending", "noise", "unavailable",
];

export function DataScanPanel({ restaurantId }: DataScanPanelProps) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const runScan = async () => {
    setScanning(true);
    setError("");
    try {
      const data = await scanRestaurant(restaurantId);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      {/* Header + Scan action */}
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.md, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ ...typography.h3, margin: 0 }}>Scan All Available Data</h3>
            <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
              Searches the web for this restaurant by name, address, and Google Business Profile — then lists everything found.
            </p>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            style={{
              padding: `${spacing.md} ${spacing.xl}`, borderRadius: radius.md,
              background: colors.primary, color: "#fff", border: "none", fontWeight: 600,
              cursor: scanning ? "wait" : "pointer", fontSize: "0.875rem",
              opacity: scanning ? 0.7 : 1,
            }}
          >
            {scanning ? "Scanning…" : "🔍 Scan All Data"}
          </button>
        </div>

        {error && (
          <p style={{ ...typography.small, margin: `${spacing.md} 0 0`, color: colors.danger }}>{error}</p>
        )}

        {scanning && (
          <p style={{ ...typography.caption, margin: `${spacing.md} 0 0`, color: colors.muted }}>
            Discovering website, menu, reviews, listings, social profiles, and Google Business Profile…
          </p>
        )}
      </div>

      {/* Results */}
      {result && !scanning && (
        <>
          {/* Data Integrity summary */}
          <div style={{ padding: spacing.lg, background: colors.successLight, borderRadius: radius.lg, border: `1px solid ${colors.success}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <span style={{ fontSize: "1rem" }}>🛡️</span>
              <span style={{ ...typography.body, fontWeight: 600, color: colors.success }}>Data Integrity</span>
            </div>
            <div style={{ display: "flex", gap: spacing.xl, flexWrap: "wrap" }}>
              <span style={{ ...typography.small, color: colors.textSecondary }}>
                <span style={{ color: colors.success, fontWeight: 700 }}>{result.integrity.real}</span> real sources
              </span>
              <span style={{ ...typography.small, color: colors.textSecondary }}>
                <span style={{ color: colors.mutedDarker, fontWeight: 700 }}>{result.integrity.pending}</span> pending
              </span>
              <span style={{ ...typography.small, color: colors.textSecondary }}>
                <span style={{ color: colors.mutedDarker, fontWeight: 700 }}>{result.integrity.unavailable}</span> unavailable
              </span>
              <span style={{ ...typography.small, color: colors.textSecondary }}>
                <span style={{ color: result.integrity.synthetic > 0 ? colors.danger : colors.textSecondary, fontWeight: 700 }}>
                  {result.integrity.synthetic}
                </span> excluded (synthetic/noise)
              </span>
            </div>
            <p style={{ ...typography.caption, margin: `${spacing.md} 0 0`, color: colors.textSecondary }}>
              Every source is scanned live, grouped by type, and flagged real vs excluded. Only <strong style={{ color: colors.success }}>Real</strong> sources are used for scoring. Scanned {formatDate(result.scannedAt)}.
            </p>
          </div>

          {/* Grouped sources */}
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            {CATEGORY_ORDER.filter((c) => result.groups[c] && result.groups[c].length > 0).map((cat) => {
              const meta = categoryMeta(cat);
              const items = result.groups[cat];
              const real = items.filter((s) => s.status === "real").length;
              return (
                <div key={cat} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                    <h4 style={{ ...typography.h3, margin: 0, fontSize: "1rem" }}>
                      {meta.icon} {meta.label} ({items.length})
                    </h4>
                    {real > 0 && (
                      <span style={{ ...typography.caption, color: colors.success, fontWeight: 600 }}>{real} real</span>
                    )}
                  </div>
                  {items.map((s, i) => <SourceRow key={`${cat}-${i}`} source={s} />)}
                </div>
              );
            })}
            {result.total === 0 && (
              <p style={{ ...typography.small, margin: 0, color: colors.muted }}>
                No public sources found for this restaurant yet. Try running an audit or providing a Google Business Profile link.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
